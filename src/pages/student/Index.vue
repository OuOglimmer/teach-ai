<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const modules = [
  {
    title: 'AI答疑',
    icon: '💬',
    desc: '7×24小时智能在线答疑，即时解答并细致解析知识难点',
    color: 'from-blue-400 to-blue-600',
    path: '/student/qa',
    phase: '贯穿全流程'
  },
  {
    title: '学习建议',
    icon: '💡',
    desc: '基于多维度、多场景数据，生成定制化学习优化建议，指出薄弱知识点',
    color: 'from-amber-400 to-orange-500',
    path: '/student/suggestions',
    phase: '课后巩固'
  },
  {
    title: '个性化练习',
    icon: '✏️',
    desc: '根据日常学情，智能定制专属提分练习，避免盲目刷题',
    color: 'from-emerald-400 to-teal-500',
    path: '/student/practice',
    phase: '课后提升'
  }
]
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">学生学习辅导</h1>
      <p class="text-sm text-gray-500 mt-1">贯穿课前、课中、课后全流程，AI驱动个性化学习</p>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div v-for="m in modules" :key="m.title" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
        <div class="h-2 bg-linear-to-r" :class="m.color"></div>
        <div class="p-6">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-linear-to-br" :class="m.color">
              {{ m.icon }}
            </div>
            <div>
              <h3 class="font-semibold text-gray-800 text-lg">{{ m.title }}</h3>
              <span class="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded-full">{{ m.phase }}</span>
            </div>
          </div>
          <p class="text-sm text-gray-500 leading-relaxed">{{ m.desc }}</p>
          <button
            @click="router.push(m.path)"
            class="mt-5 w-full py-2.5 bg-gray-50 text-gray-700 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
          >
            进入{{ m.title }}
          </button>
        </div>
      </div>
    </div>

    <div class="bg-linear-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold">AI学习助手已就绪</h3>
          <p class="text-sm text-indigo-100 mt-1">今天已为你解答 5 个问题，生成 2 条学习建议</p>
        </div>
        <button @click="router.push('/student/qa')" class="px-6 py-2.5 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
          开始提问
        </button>
      </div>
    </div>
  </div>
</template>
