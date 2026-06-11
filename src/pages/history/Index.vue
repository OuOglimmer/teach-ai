<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type { AiConversation } from '@/types'

const auth = useAuthStore()
const conversations = ref<AiConversation[]>([])
const searchQuery = ref('')
const dateFilter = ref('all')

onMounted(async () => {
  if (auth.user) {
    conversations.value = await api.getConversations(auth.user.id)
  }
})

const filteredConversations = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  const now = new Date()

  return conversations.value.filter(conv => {
    const haystack = [
      conv.title,
      conv.subject,
      ...(conv.messages || []).map(m => m.content)
    ].join(' ').toLowerCase()

    const matchesQuery = !query || haystack.includes(query)
    if (!matchesQuery) return false

    if (dateFilter.value === 'all') return true

    const created = new Date(conv.created_at)
    if (dateFilter.value === 'today') {
      return created.toDateString() === now.toDateString()
    }

    if (dateFilter.value === 'week') {
      const weekAgo = new Date(now)
      weekAgo.setDate(now.getDate() - 7)
      return created >= weekAgo
    }

    if (dateFilter.value === 'month') {
      return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth()
    }

    return true
  })
})

async function deleteConv(id: string) {
  if (!confirm('确认删除此对话记录？')) return
  await api.deleteConversation(id)
  conversations.value = conversations.value.filter(c => c.id !== id)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">AI对话历史记录</h1>
      <p class="text-sm text-gray-500 mt-1">管理你与AI答疑助手的每一次对话 · AI启航教育</p>
    </div>

    <div class="flex gap-4 items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div class="flex-1">
        <input v-model="searchQuery" type="text" placeholder="搜索对话内容..." class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <select v-model="dateFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="all">全部时间</option>
        <option value="today">今天</option>
        <option value="week">本周</option>
        <option value="month">本月</option>
      </select>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="divide-y divide-gray-100">
        <div v-for="conv in filteredConversations" :key="conv.id" class="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-lg">💬</div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-800 truncate">{{ conv.title }}</p>
            <div class="flex items-center gap-3 mt-1">
              <span class="text-xs text-gray-400">{{ new Date(conv.created_at).toLocaleString('zh-CN') }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="conv.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'">
                {{ conv.status === 'active' ? '进行中' : '已解答' }}
              </span>
              <span class="text-xs text-gray-400">{{ conv.subject }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1.5 bg-indigo-50 text-indigo-600 text-xs rounded-lg hover:bg-indigo-100 transition-colors">继续对话</button>
            <button @click="deleteConv(conv.id)" class="px-3 py-1.5 text-gray-400 text-xs rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors">删除</button>
          </div>
        </div>
        <div v-if="filteredConversations.length === 0" class="p-12 text-center text-gray-400">
          {{ conversations.length === 0 ? '暂无对话记录' : '没有匹配的对话记录' }}
        </div>
      </div>
    </div>
  </div>
</template>
