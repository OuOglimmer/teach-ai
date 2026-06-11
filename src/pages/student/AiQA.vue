<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  streamChat,
  clearKeyCache,
  clearRuntimeApiKey,
  getApiKeySource,
  setRuntimeApiKey,
  type ApiKeySource,
  type DeepSeekMessage
} from '@/lib/deepseek'
import { api } from '@/lib/api'
import type { AiConversation } from '@/types'

const auth = useAuthStore()

interface LocalMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface LocalConversation {
  id: string
  title: string
  messages: LocalMessage[]
  subject: string
  createdAt: number
  updatedAt: number
}

const conversations = ref<LocalConversation[]>([])
const currentConvId = ref<string | null>(null)
const input = ref('')
const loading = ref(false)
const showApiKeyInput = ref(false)
const apiKeyInput = ref('')
const streamingContent = ref('')
const abortController = ref<AbortController | null>(null)
const messagesEndRef = ref<HTMLDivElement | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)
const attachedFiles = ref<{ name: string; content: string; type: string }[]>([])
const hasKey = ref(false)
const keySource = ref<ApiKeySource>('none')
const saveToVault = ref(false)
const loadingHistory = ref(false)
const persistedConversationIds = new Set<string>()

const MAX_UPLOAD_SIZE = 1024 * 1024
const TEXT_FILE_EXTENSIONS = new Set([
  '.txt', '.md', '.markdown', '.csv', '.json', '.xml',
  '.html', '.css', '.js', '.ts', '.vue', '.py', '.java',
  '.c', '.cpp', '.cs', '.go', '.rs', '.sql', '.yaml', '.yml'
])

const quickQuestions = [
  '如何求解二次函数的最值？',
  '简述牛顿第一定律',
  '英语现在完成时的用法',
  '勾股定理的证明方法',
  '写一篇关于环保的英语作文',
  '求解一元二次方程 x²-5x+6=0',
]

const currentConv = computed(() =>
  conversations.value.find(c => c.id === currentConvId.value) || null
)

const displayMessages = computed(() => {
  const msgs = currentConv.value?.messages || []
  if (streamingContent.value && loading.value) {
    return [...msgs, { id: 'streaming', role: 'assistant' as const, content: streamingContent.value, timestamp: Date.now() }]
  }
  return msgs
})

onMounted(async () => {
  await loadConversations()
  await checkKey()
})

async function loadConversations() {
  if (!auth.user?.id) return
  loadingHistory.value = true
  try {
    const convs = await api.getConversations(auth.user.id)
    persistedConversationIds.clear()
    conversations.value = convs.map(c => ({
      id: c.id,
      title: c.title,
      messages: (c.messages || []).map((m: any) => ({
        id: m.id || String(Math.random()),
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at || c.created_at).getTime(),
      })),
      subject: c.subject,
      createdAt: new Date(c.created_at).getTime(),
      updatedAt: new Date(c.updated_at).getTime(),
    }))
    conversations.value.forEach(c => persistedConversationIds.add(c.id))
    if (conversations.value.length > 0) {
      currentConvId.value = conversations.value[0].id
    }
  } catch (error) {
    console.warn('Failed to load conversations:', error)
  }
  loadingHistory.value = false
}

async function saveConversation(conv: LocalConversation) {
  if (!auth.user?.id) return
  try {
    const messages = conv.messages.map(m => ({
      role: m.role,
      content: m.content,
      created_at: new Date(m.timestamp).toISOString(),
    }))
    if (persistedConversationIds.has(conv.id)) {
      await api.updateConversation(conv.id, {
        messages: messages as any,
        title: conv.title,
        updated_at: new Date().toISOString(),
      } as any)
    } else {
      await api.createConversation({
        id: conv.id,
        user_id: auth.user.id,
        title: conv.title,
        messages: messages as any,
        subject: conv.subject,
        status: 'active',
      } as any)
      persistedConversationIds.add(conv.id)
    }
  } catch (error) {
    console.warn('Failed to save conversation:', error)
  }
}

async function deleteConversationFromApi(id: string) {
  try {
    await api.deleteConversation(id)
    persistedConversationIds.delete(id)
  } catch (error) {
    console.warn('Failed to delete conversation:', error)
  }
}

const mockMode = ref(false)

function generateId(): string {
  return crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

async function checkKey() {
  const source = await getApiKeySource()
  keySource.value = source
  mockMode.value = source === 'none'
  hasKey.value = source !== 'none'
}

async function saveApiKey() {
  if (!apiKeyInput.value.trim()) return
  const key = apiKeyInput.value.trim()
  let savedToVault = false

  if (saveToVault.value && (auth.isAdmin || auth.isTeacher)) {
    try {
      await api.saveVaultSecret('teach-ai-key', key)
      savedToVault = true
    } catch (error) {
      console.warn('Failed to save API key to Vault, falling back to session key:', error)
    }
  }

  clearKeyCache()
  if (savedToVault) {
    clearRuntimeApiKey()
  } else {
    setRuntimeApiKey(key)
  }
  await checkKey()
  showApiKeyInput.value = false
  apiKeyInput.value = ''
}

function scrollToBottom() {
  nextTick(() => {
    messagesEndRef.value?.scrollIntoView({ behavior: 'smooth' })
  })
}

watch(streamingContent, scrollToBottom)
watch(displayMessages, scrollToBottom, { deep: true })

function getSystemPrompt(): string {
  if (auth.isTeacher) {
    return '你是一位经验丰富的中学教师助手，擅长备课、出题、批改作业和提供教学建议。请用专业、耐心的语气回答，给出详细的步骤和解释。'
  }
  if (auth.isAdmin) {
    return '你是一位学校管理助手，擅长学校管理、数据分析、教育政策咨询。请用专业、客观的语气回答。'
  }
  return '你是一位耐心细致的中学全科辅导老师，擅长用启发式提问引导学生思考，而不是直接给出答案。请根据学生的年级水平调整回答的难度。'
}

async function sendMessage() {
  if (!input.value.trim() && attachedFiles.value.length === 0) return
  if (loading.value) return
  if (!hasKey.value && !mockMode.value) {
    showApiKeyInput.value = true
    return
  }

  const userContent = buildUserContent()
  const userMsg: LocalMessage = {
    id: generateId(),
    role: 'user',
    content: userContent,
    timestamp: Date.now()
  }

  if (!currentConvId.value) {
    const newConv: LocalConversation = {
      id: generateId(),
      title: input.value.trim().slice(0, 30) || '文件问答',
      messages: [userMsg],
      subject: '综合',
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    conversations.value.unshift(newConv)
    currentConvId.value = newConv.id
    void saveConversation(newConv)
  } else {
    const conv = conversations.value.find(c => c.id === currentConvId.value)
    if (conv) {
      conv.messages.push(userMsg)
      conv.updatedAt = Date.now()
      void saveConversation(conv)
    }
  }

  input.value = ''
  attachedFiles.value = []
  loading.value = true
  streamingContent.value = ''
  abortController.value = new AbortController()

  const deepseekMessages: DeepSeekMessage[] = [
    { role: 'system', content: getSystemPrompt() }
  ]

  const conv = conversations.value.find(c => c.id === currentConvId.value)
  if (conv) {
    for (const m of conv.messages) {
      deepseekMessages.push({ role: m.role, content: m.content })
    }
  }

  streamChat(deepseekMessages, {
    onToken: (token) => {
      streamingContent.value += token
    },
    onDone: (fullContent) => {
      const aiMsg: LocalMessage = {
        id: generateId(),
        role: 'assistant',
        content: fullContent,
        timestamp: Date.now()
      }
      const conv = conversations.value.find(c => c.id === currentConvId.value)
      if (conv) {
        conv.messages.push(aiMsg)
        conv.updatedAt = Date.now()
        void saveConversation(conv)
      }
      streamingContent.value = ''
      loading.value = false
      abortController.value = null
    },
    onError: (err) => {
      const errorMsg: LocalMessage = {
        id: generateId(),
        role: 'assistant',
        content: `抱歉，发生了错误：${err.message}`,
        timestamp: Date.now()
      }
      const conv = conversations.value.find(c => c.id === currentConvId.value)
      if (conv) {
        conv.messages.push(errorMsg)
        void saveConversation(conv)
      }
      streamingContent.value = ''
      loading.value = false
      abortController.value = null
    }
  }, { signal: abortController.value.signal })
}

function buildUserContent(): string {
  let content = input.value.trim()
  for (const file of attachedFiles.value) {
    if (file.type.startsWith('image/')) {
      content += `\n\n[上传的图片文件: ${file.name}]\n${file.content}`
    } else {
      content += `\n\n[上传的文件: ${file.name}]\n文件内容如下：\n${file.content}`
    }
  }
  return content
}

function stopGeneration() {
  abortController.value?.abort()
  loading.value = false
  if (streamingContent.value) {
    const conv = conversations.value.find(c => c.id === currentConvId.value)
    if (conv) {
      conv.messages.push({
        id: generateId(),
        role: 'assistant',
        content: streamingContent.value,
        timestamp: Date.now()
      })
      void saveConversation(conv)
    }
    streamingContent.value = ''
  }
  abortController.value = null
}

function selectConversation(id: string) {
  if (loading.value) return
  currentConvId.value = id
  streamingContent.value = ''
}

function newConversation() {
  if (loading.value) { stopGeneration() }
  currentConvId.value = null
  streamingContent.value = ''
  attachedFiles.value = []
}

function deleteConversation(id: string) {
  if (loading.value) return
  conversations.value = conversations.value.filter(c => c.id !== id)
  if (currentConvId.value === id) currentConvId.value = null
  deleteConversationFromApi(id)
}

function quickAsk(q: string) {
  input.value = q
  sendMessage()
}

function handleFileUpload() {
  fileInputRef.value?.click()
}

function getFileExtension(fileName: string): string {
  const index = fileName.lastIndexOf('.')
  return index >= 0 ? fileName.slice(index).toLowerCase() : ''
}

function isSupportedTextFile(file: File): boolean {
  const extension = getFileExtension(file.name)
  return file.type.startsWith('text/') || TEXT_FILE_EXTENSIONS.has(extension)
}

async function onFileSelected(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files) return

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    try {
      const content = await readFileAsText(file)
      attachedFiles.value.push({
        name: file.name,
        content: content,
        type: file.type
      })
    } catch (error: any) {
      attachedFiles.value.push({
        name: file.name,
        content: `[无法读取文件内容：${error?.message || '未知错误'}，文件类型: ${file.type || '未知'}]`,
        type: file.type || 'unknown'
      })
    }
  }
  target.value = ''
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_UPLOAD_SIZE) {
      reject(new Error(`文件超过 ${Math.round(MAX_UPLOAD_SIZE / 1024 / 1024)}MB 限制，请拆分后上传。`))
      return
    }

    if (!isSupportedTextFile(file)) {
      reject(new Error('当前仅支持文本、Markdown、代码、JSON、CSV、XML、SQL、YAML 等文本类文件。'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file, 'UTF-8')
  })
}

function removeFile(index: number) {
  attachedFiles.value.splice(index, 1)
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return d.toLocaleDateString()
}
</script>

<template>
  <div class="flex gap-6 h-[calc(100vh-8rem)]">
    <!-- Sidebar: Conversations -->
    <div class="w-64 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col shrink-0">
      <div class="p-3 border-b border-gray-100 space-y-2">
        <button @click="newConversation" class="w-full py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + 新对话
        </button>
        <button @click="showApiKeyInput = true" class="w-full py-1.5 border border-gray-200 text-gray-500 rounded-lg text-xs hover:bg-gray-50 transition-colors">
          {{ mockMode ? '⚙️ 配置API Key' : keySource === 'vault' ? '🔑🛡️ Vault已配置' : keySource === 'env' ? '🔑 环境变量已配置' : keySource === 'runtime' ? '🔑 本次会话已配置' : '⚙️ 配置API Key' }}
        </button>
        <div v-if="mockMode" class="w-full py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-600 rounded-lg text-xs text-center">🎮 体验模式 · 无需 Key</div>
      </div>
      <div class="flex-1 overflow-y-auto">
        <div v-for="conv in conversations" :key="conv.id"
          class="group relative border-b border-gray-50"
          :class="currentConvId === conv.id ? 'bg-indigo-50' : 'hover:bg-gray-50'"
        >
          <button @click="selectConversation(conv.id)" class="w-full p-3 text-left">
            <p class="text-sm font-medium text-gray-800 truncate pr-6">{{ conv.title }}</p>
            <p class="text-xs text-gray-400 mt-1">{{ formatTime(conv.updatedAt) }} · {{ conv.messages.length }}条消息</p>
          </button>
          <button @click="deleteConversation(conv.id)"
            class="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-xs text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-red-50">
            ✕
          </button>
        </div>
        <div v-if="conversations.length === 0" class="p-6 text-center text-gray-400 text-sm">
          暂无对话记录
        </div>
      </div>
    </div>

    <!-- Main Chat Area -->
    <div class="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
      <!-- Header -->
      <div class="p-4 border-b border-gray-100 flex items-center justify-between">
        <div class="text-sm font-medium text-indigo-600">🤖 AI智能答疑 · DeepSeek</div>
        <div class="flex items-center gap-2">
          <div v-if="mockMode" class="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-600 font-medium">🎮 体验模式</div>
          <div v-else-if="keySource === 'vault'" class="text-xs text-green-500">🛡️ Vault</div>
          <div v-else-if="keySource === 'env'" class="text-xs text-blue-500">🔑 环境变量</div>
          <div v-else-if="keySource === 'runtime'" class="text-xs text-amber-500">🔑 本次会话</div>
        </div>
      </div>

      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-4">
        <!-- Empty State -->
        <div v-if="!currentConv" class="flex flex-col items-center justify-center h-full text-center text-gray-400">
          <div class="text-6xl mb-4">💬</div>
          <p class="text-lg font-medium text-gray-600">开始你的提问</p>
          <p class="text-sm mt-1">AI助手7×24小时在线，随时为你解答</p>
          <div class="mt-6 grid grid-cols-2 gap-2 w-96">
            <button v-for="q in quickQuestions" :key="q"
              @click="quickAsk(q)"
              class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors text-left"
            >{{ q }}</button>
          </div>
        </div>

        <!-- Messages List -->
        <div v-for="msg in displayMessages" :key="msg.id" class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
          <div class="max-w-[75%] p-3 rounded-lg text-sm leading-relaxed whitespace-pre-wrap"
            :class="msg.role === 'user'
              ? 'bg-indigo-600 text-white rounded-br-none'
              : 'bg-gray-100 text-gray-800 rounded-bl-none'"
          >
            <div v-if="msg.role === 'assistant' && msg.id === 'streaming'" class="streaming-text">
              {{ msg.content }}<span class="animate-pulse">▍</span>
            </div>
            <div v-else>{{ msg.content }}</div>
          </div>
        </div>

        <div ref="messagesEndRef"></div>
      </div>

      <!-- API Key Dialog -->
      <div v-if="showApiKeyInput" class="px-4 py-3 bg-amber-50 border-t border-amber-200">
        <div class="flex gap-2 items-center">
          <span class="text-xs text-amber-700 shrink-0">DeepSeek API Key：</span>
          <input v-model="apiKeyInput" type="password"
            class="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 outline-none"
            placeholder="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
          <button @click="saveApiKey" class="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600">保存</button>
          <button @click="showApiKeyInput = false" class="px-3 py-1.5 text-xs text-gray-400 hover:text-gray-600">取消</button>
        </div>
        <div class="flex items-center gap-2 mt-1">
          <label v-if="auth.isAdmin || auth.isTeacher" class="flex items-center gap-1 text-xs text-amber-600 cursor-pointer">
            <input v-model="saveToVault" type="checkbox" class="accent-amber-500" />
            保存到 Supabase Vault（加密存储，推荐）
          </label>
        </div>
        <p class="text-xs text-amber-500 mt-1">
          不勾选则仅保存到本次浏览器会话。也可通过 .env 环境变量 VITE_DEEPSEEK_API_KEY 配置。
        </p>
      </div>

      <!-- Input Area -->
      <div class="p-4 border-t border-gray-100">
        <!-- Attached Files -->
        <div v-if="attachedFiles.length" class="flex flex-wrap gap-2 mb-2">
          <div v-for="(file, i) in attachedFiles" :key="i"
            class="flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs">
            <span>📎 {{ file.name }}</span>
            <button @click="removeFile(i)" class="hover:text-red-500 ml-1">✕</button>
          </div>
        </div>

        <div class="flex gap-2">
          <button @click="handleFileUpload" class="px-3 py-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="上传文件">
            📎
          </button>
          <input ref="fileInputRef" type="file" multiple class="hidden" @change="onFileSelected" accept=".txt,.md,.markdown,.py,.js,.ts,.vue,.html,.css,.json,.csv,.xml,.sql,.yaml,.yml" />
          <input
            v-model="input"
            @keydown.enter="sendMessage"
            placeholder="输入你的问题，或上传文件进行分析..."
            class="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
            :disabled="loading"
          />
          <button v-if="loading" @click="stopGeneration"
            class="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors">
            停止
          </button>
          <button v-else @click="sendMessage"
            :disabled="!input.trim() && attachedFiles.length === 0"
            class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.streaming-text {
  word-break: break-word;
}
</style>
