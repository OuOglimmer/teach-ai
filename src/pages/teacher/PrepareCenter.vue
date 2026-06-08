<script setup lang="ts">
import { ref } from 'vue'

const searchQuery = ref('')
const selectedSubject = ref('全部')
const selectedGrade = ref('全部')

const subjects = ['全部', '语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治']
const grades = ['全部', '七年级', '八年级', '九年级', '高一', '高二', '高三']

const features = [
  { icon: '📄', title: '教案自动生成', desc: '输入教学主题，AI自动生成完整的教案，含教学目标、重难点、教学过程' },
  { icon: '🖼️', title: '课件推荐', desc: '基于当前教学进度，智能推荐优质课件资源，支持一键预览与下载' },
  { icon: '📝', title: '习题库调用', desc: '海量题库按知识点、难度筛选，支持自定义组卷，一键插入教案' },
  { icon: '🎯', title: '课堂活动设计', desc: 'AI推荐互动课堂活动方案，提升学生参与度与教学效果' },
]

const recentPlans = [
  { title: '二次函数图像性质', subject: '数学', grade: '九年级', updated: '2小时前' },
  { title: '英语现在完成时', subject: '英语', grade: '八年级', updated: '昨天' },
  { title: '光的折射定律', subject: '物理', grade: '八年级', updated: '3天前' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">教师备课中心</h1>
        <p class="text-sm text-gray-500 mt-1">AI辅助备课，高效准备每一堂课</p>
      </div>
      <button class="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors">
        + 创建新教案
      </button>
    </div>

    <div class="flex gap-4 items-center bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div class="flex-1">
        <input v-model="searchQuery" type="text" placeholder="搜索教案、课件、习题..." class="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
      </div>
      <select v-model="selectedSubject" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option v-for="s in subjects" :key="s" :value="s">{{ s }}</option>
      </select>
      <select v-model="selectedGrade" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option v-for="g in grades" :key="g" :value="g">{{ g }}</option>
      </select>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div v-for="f in features" :key="f.title" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
        <div class="flex items-center gap-3 mb-2">
          <span class="text-2xl">{{ f.icon }}</span>
          <h3 class="font-semibold text-gray-800">{{ f.title }}</h3>
        </div>
        <p class="text-sm text-gray-500">{{ f.desc }}</p>
        <button class="mt-3 text-sm text-indigo-600 font-medium hover:text-indigo-700">立即使用 →</button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm border border-gray-100">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">最近备课记录</h3>
      </div>
      <div class="divide-y divide-gray-50">
        <div v-for="plan in recentPlans" :key="plan.title" class="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer">
          <div>
            <p class="text-sm font-medium text-gray-800">{{ plan.title }}</p>
            <p class="text-xs text-gray-400">{{ plan.subject }} · {{ plan.grade }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-gray-400">{{ plan.updated }}</span>
            <button class="text-xs text-indigo-600 hover:text-indigo-700">编辑</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
