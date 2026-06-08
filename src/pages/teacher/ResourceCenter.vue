<script setup lang="ts">
import { ref } from 'vue'

const selectedSubject = ref('全部')
const selectedGrade = ref('全部')
const selectedType = ref('全部')

const types = ['全部', 'courseware', 'video', 'exercise', 'lesson_plan']
const typeLabels: Record<string, string> = { courseware: '课件', video: '视频', exercise: '习题', lesson_plan: '教案' }
const typeIcons: Record<string, string> = { courseware: '📖', video: '🎬', exercise: '📝', lesson_plan: '📄' }

const aiRecommended = [
  { title: '二次函数图像与性质', type: 'courseware', subject: '数学', grade: '九年级' },
  { title: '英语时态专题讲解', type: 'video', subject: '英语', grade: '八年级' },
  { title: '光的折射实验演示', type: 'video', subject: '物理', grade: '八年级' },
]

const resources = ref([
  { title: '人教版九年级数学上册课件', type: 'courseware', subject: '数学', grade: '九年级', size: '12MB', downloads: 156 },
  { title: '三角函数专题讲解视频', type: 'video', subject: '数学', grade: '九年级', size: '45MB', downloads: 89 },
  { title: '二次函数练习题精选', type: 'exercise', subject: '数学', grade: '九年级', size: '2MB', downloads: 234 },
  { title: '英语现在完成时教案', type: 'lesson_plan', subject: '英语', grade: '八年级', size: '1MB', downloads: 67 },
  { title: '物理牛顿定律实验视频', type: 'video', subject: '物理', grade: '八年级', size: '38MB', downloads: 112 },
])
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">教学资源中心 · AI启航教育</h1>
      <p class="text-sm text-gray-500 mt-1">按学科、年级、资源类型分类，AI推荐助力教学</p>
    </div>

    <!-- AI Recommended -->
    <div class="bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl p-5 text-white">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-lg">🤖</span>
        <span class="font-semibold">AI推荐资源</span>
        <span class="text-sm text-indigo-200">基于当前教学进度智能推送</span>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div v-for="r in aiRecommended" :key="r.title" class="bg-white/10 rounded-lg p-3 backdrop-blur-sm hover:bg-white/20 cursor-pointer transition-colors">
          <div class="text-lg mb-1">{{ typeIcons[r.type] }}</div>
          <p class="text-sm font-medium">{{ r.title }}</p>
          <p class="text-xs text-indigo-200 mt-1">{{ typeLabels[r.type] }} · {{ r.grade }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex gap-4 items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <select v-model="selectedSubject" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="全部">全部学科</option>
        <option>语文</option><option>数学</option><option>英语</option><option>物理</option><option>化学</option>
      </select>
      <select v-model="selectedGrade" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="全部">全部年级</option>
        <option>七年级</option><option>八年级</option><option>九年级</option><option>高一</option><option>高二</option><option>高三</option>
      </select>
      <select v-model="selectedType" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="全部">全部类型</option>
        <option value="courseware">课件</option><option value="video">视频</option><option value="exercise">习题</option><option value="lesson_plan">教案</option>
      </select>
    </div>

    <!-- Resource Grid -->
    <div class="grid grid-cols-3 gap-4">
      <div v-for="r in resources" :key="r.title" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-lg">{{ typeIcons[r.type] }}</div>
          <div>
            <span class="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">{{ typeLabels[r.type] }}</span>
          </div>
        </div>
        <h3 class="font-medium text-gray-800 text-sm mb-2">{{ r.title }}</h3>
        <p class="text-xs text-gray-400">{{ r.subject }} · {{ r.grade }} · {{ r.size }}</p>
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
          <span class="text-xs text-gray-400">{{ r.downloads }} 次下载</span>
          <button class="text-xs text-indigo-600 hover:text-indigo-700 font-medium">下载</button>
        </div>
      </div>
    </div>
  </div>
</template>
