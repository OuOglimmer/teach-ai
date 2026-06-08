<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type { Test, Class } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const tests = ref<Test[]>([])
const allClasses = ref<Class[]>([])
const selectedClass = ref('')
const loading = ref(false)

const examTypeMap: Record<string, string> = {
  standard: '常规考试', quiz: '随堂测验', midterm: '期中考试', final: '期末考试', mock: '模拟考试',
}
const statusMap: Record<string, string> = {
  draft: '草稿', published: '已发布', grading: '批改中', done: '已完成',
}
const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-600',
  grading: 'bg-amber-100 text-amber-600',
  done: 'bg-green-100 text-green-600',
}

onMounted(async () => {
  allClasses.value = await api.getClasses()
  await loadTests()
})

async function loadTests() {
  loading.value = true
  tests.value = await api.getTests(selectedClass.value || undefined)
  loading.value = false
}

function formatDate(d: string) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

function durationText(minutes: number) {
  if (minutes < 60) return `${minutes}分钟`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}小时${m}分钟` : `${h}小时`
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">全部考试信息</h1>
        <p class="text-sm text-gray-500 mt-1">共 {{ tests.length }} 场考试</p>
      </div>
      <button @click="router.push('/dashboard')" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200">返回首页</button>
    </div>

    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">筛选班级：</span>
      <select v-model="selectedClass" @change="loadTests" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">全部班级</option>
        <option v-for="c in allClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">考试总数</p>
        <p class="text-2xl font-bold text-indigo-600 mt-1">{{ tests.length }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">进行中</p>
        <p class="text-2xl font-bold text-amber-600 mt-1">{{ tests.filter(t => t.status === 'published').length }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">批改中</p>
        <p class="text-2xl font-bold text-orange-600 mt-1">{{ tests.filter(t => t.status === 'grading').length }}</p>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">已完成</p>
        <p class="text-2xl font-bold text-green-600 mt-1">{{ tests.filter(t => t.status === 'done').length }}</p>
      </div>
    </div>

    <!-- Test List -->
    <div v-if="loading" class="text-center py-12 text-gray-400">加载中...</div>
    <div v-else-if="tests.length === 0" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
      <div class="text-5xl mb-4">📋</div>
      <p class="text-gray-500">暂无考试记录</p>
    </div>
    <div v-else class="space-y-4">
      <div v-for="t in tests" :key="t.id" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-2">
              <h3 class="font-semibold text-gray-800">{{ t.title }}</h3>
              <span class="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">{{ examTypeMap[t.exam_type] || t.exam_type }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full" :class="statusColor[t.status]">{{ statusMap[t.status] }}</span>
            </div>
            <div class="grid grid-cols-4 gap-4 text-sm text-gray-500">
              <div>
                <span class="text-gray-400">班级：</span>
                <span class="text-gray-700">{{ t.class?.name || '-' }}</span>
              </div>
              <div>
                <span class="text-gray-400">时长：</span>
                <span class="text-gray-700">{{ durationText(t.duration) }}</span>
              </div>
              <div>
                <span class="text-gray-400">开始：</span>
                <span class="text-gray-700">{{ formatDate(t.start_time) }}</span>
              </div>
              <div>
                <span class="text-gray-400">结束：</span>
                <span class="text-gray-700">{{ formatDate(t.end_time) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
