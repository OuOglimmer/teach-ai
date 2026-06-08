<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type { RegistrationApproval, Class } from '@/types'

const auth = useAuthStore()
const activeTab = ref<'approvals' | 'classes' | 'stats'>('approvals')

const pendingRegs = ref<RegistrationApproval[]>([])
const allClasses = ref<Class[]>([])
const showCreateClass = ref(false)
const newClassName = ref('')
const newClassGrade = ref('九年级')
const loading = ref(false)
const message = ref('')

onMounted(async () => {
  await loadApprovals()
  allClasses.value = await api.getClasses()
})

async function loadApprovals() {
  pendingRegs.value = await api.getPendingRegistrations()
}

async function handleApproval(id: string, status: 'approved' | 'rejected') {
  if (!auth.user) return
  await api.handleRegistration(id, status, auth.user.id)
  message.value = status === 'approved' ? '已批准注册请求' : '已拒绝注册请求'
  await loadApprovals()
  setTimeout(() => message.value = '', 3000)
}

async function createClass() {
  if (!newClassName.value.trim()) return
  loading.value = true
  await api.createClass({
    name: newClassName.value.trim(),
    grade: newClassGrade.value,
    created_by: auth.user?.id || ''
  })
  allClasses.value = await api.getClasses()
  showCreateClass.value = false
  newClassName.value = ''
  loading.value = false
}

const stats = [
  { class: '九年级(1)班', aiQA: 156, suggestions: 45, exercises: 78, avgScore: 82.5 },
  { class: '九年级(2)班', aiQA: 132, suggestions: 38, exercises: 62, avgScore: 78.3 },
  { class: '八年级(1)班', aiQA: 98, suggestions: 29, exercises: 45, avgScore: 85.1 },
  { class: '七年级(1)班', aiQA: 74, suggestions: 18, exercises: 33, avgScore: 88.6 },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">班级/学校管理</h1>
        <p class="text-sm text-gray-500 mt-1">AI启航教育 · 成都市第九百九十九中学</p>
      </div>
    </div>

    <div class="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      <button v-for="tab in [{k:'approvals',l:'注册审批'},{k:'classes',l:'班级管理'},{k:'stats',l:'使用统计'}]" :key="tab.k"
        @click="activeTab = tab.k as any"
        class="px-4 py-2 text-sm rounded-md transition-colors"
        :class="activeTab === tab.k ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
      >{{ tab.l }}<span v-if="tab.k === 'approvals' && pendingRegs.length" class="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">{{ pendingRegs.length }}</span></button>
    </div>

    <p v-if="message" class="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">{{ message }}</p>

    <!-- Approvals -->
    <div v-if="activeTab === 'approvals'">
      <div v-if="pendingRegs.length === 0" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <div class="text-5xl mb-4">✅</div>
        <p class="text-gray-500">暂无待审批的注册请求</p>
      </div>
      <div v-else class="space-y-4">
        <div v-for="reg in pendingRegs" :key="reg.id" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white" :class="reg.role === 'teacher' ? 'bg-emerald-500' : 'bg-purple-500'">
              {{ reg.nickname[0] }}
            </div>
            <div>
              <p class="font-medium text-gray-800">{{ reg.nickname }}</p>
              <p class="text-sm text-gray-500">{{ reg.email }}</p>
              <div class="flex gap-2 mt-1">
                <span class="text-xs px-2 py-0.5 rounded-full" :class="reg.role === 'teacher' ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'">
                  {{ reg.role === 'teacher' ? '教师' : '管理员' }}
                </span>
                <span class="text-xs text-gray-400">{{ new Date(reg.created_at).toLocaleDateString() }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2">
            <button @click="handleApproval(reg.id, 'approved')" class="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">批准</button>
            <button @click="handleApproval(reg.id, 'rejected')" class="px-4 py-2 bg-red-400 text-white rounded-lg text-sm font-medium hover:bg-red-500 transition-colors">拒绝</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Classes -->
    <div v-if="activeTab === 'classes'">
      <div class="mb-4">
        <button @click="showCreateClass = !showCreateClass" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
          + 创建班级
        </button>
      </div>

      <div v-if="showCreateClass" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
        <h3 class="font-semibold text-gray-800 mb-4">创建新班级</h3>
        <div class="flex gap-4 items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">班级名称</label>
            <input v-model="newClassName" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="例如：九年级(3)班" />
          </div>
          <div class="w-40">
            <label class="block text-sm font-medium text-gray-700 mb-1">年级</label>
            <select v-model="newClassGrade" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>七年级</option><option>八年级</option><option>九年级</option><option>高一</option><option>高二</option><option>高三</option>
            </select>
          </div>
          <button @click="createClass" :disabled="loading" class="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            确定创建
          </button>
        </div>
      </div>

      <div v-if="allClasses.length === 0" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <div class="text-5xl mb-4">📚</div>
        <p class="text-gray-500">暂无班级数据，请先创建班级</p>
      </div>
      <div v-else class="grid grid-cols-2 gap-4">
        <div v-for="c in allClasses" :key="c.id" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <h3 class="font-semibold text-gray-800">{{ c.name }}</h3>
            <span class="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{{ c.grade }}</span>
          </div>
          <p class="text-xs text-gray-400">创建于 {{ new Date(c.created_at).toLocaleDateString() }}</p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div v-if="activeTab === 'stats'" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">AI教学工具使用数据</h3>
      </div>
      <table class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left p-4 font-medium text-gray-600">班级</th>
            <th class="text-left p-4 font-medium text-gray-600">AI答疑次数</th>
            <th class="text-left p-4 font-medium text-gray-600">学习建议</th>
            <th class="text-left p-4 font-medium text-gray-600">个性化练习</th>
            <th class="text-left p-4 font-medium text-gray-600">平均分</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="s in stats" :key="s.class" class="hover:bg-gray-50">
            <td class="p-4 font-medium text-gray-800">{{ s.class }}</td>
            <td class="p-4 text-gray-600">{{ s.aiQA }}</td>
            <td class="p-4 text-gray-600">{{ s.suggestions }}</td>
            <td class="p-4 text-gray-600">{{ s.exercises }}</td>
            <td class="p-4">
              <span class="font-medium" :class="s.avgScore >= 85 ? 'text-green-600' : s.avgScore >= 75 ? 'text-amber-600' : 'text-red-600'">
                {{ s.avgScore }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>