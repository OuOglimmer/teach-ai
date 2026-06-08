<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'

const auth = useAuthStore()
const loading = ref(false)
const suggestions = ref<any[]>([])

const form = ref({
  subject: '数学',
  errorDistribution: '函数与方程（40%）、几何证明（30%）、概率统计（20%）、其他（10%）',
  homeworkCompletion: 85,
})

function generateSuggestions() {
  loading.value = true

  setTimeout(async () => {
    const result = [
      {
        point: '函数与方程',
        mastery: 35,
        suggestion: '重点复习二次函数图像性质与韦达定理，建议每天完成3道综合题，注重函数图像变换的规律总结。',
      },
      {
        point: '几何证明',
        mastery: 50,
        suggestion: '掌握全等三角形判定定理和相似三角形性质，建立几何证明的"已知→求证"思维模型。',
      },
      {
        point: '概率统计',
        mastery: 65,
        suggestion: '加强对排列组合公式的理解，区分"有序"与"无序"场景，完成10道概率计算专项练习。',
      },
      {
        point: '数列与极限',
        mastery: 70,
        suggestion: '巩固等差等比数列通项与求和公式，可适当预习极限概念。',
      },
    ]

    suggestions.value = result

    if (auth.user) {
      await api.createSuggestion({
        student_id: auth.user.id,
        subject: form.value.subject,
        weak_points: result.map(r => r.point),
        suggestions: result.map(r => r.suggestion),
        exam_analysis: form.value.errorDistribution,
        homework_completion: form.value.homeworkCompletion / 100,
      })
    }

    loading.value = false
  }, 1200)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">学习建议生成器</h1>
      <p class="text-sm text-gray-500 mt-1">基于多维度数据分析，智能生成个性化学习优化建议</p>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <!-- Input panel -->
      <div class="col-span-1 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">输入学习数据</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">学科</label>
            <select v-model="form.subject" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>数学</option>
              <option>语文</option>
              <option>英语</option>
              <option>物理</option>
              <option>化学</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">错题分布</label>
            <textarea v-model="form.errorDistribution" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="例如：函数与方程 40%，几何 30%..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">作业完成率: {{ form.homeworkCompletion }}%</label>
            <input v-model.number="form.homeworkCompletion" type="range" min="0" max="100" class="w-full accent-indigo-600" />
            <div class="flex justify-between text-xs text-gray-400">
              <span>0%</span><span>100%</span>
            </div>
          </div>
          <button
            @click="generateSuggestions"
            :disabled="loading"
            class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {{ loading ? 'AI分析中...' : '生成学习建议' }}
          </button>
        </div>
      </div>

      <!-- Results -->
      <div class="col-span-2 space-y-4">
        <div v-if="suggestions.length === 0 && !loading" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div class="text-6xl mb-4">📊</div>
          <p class="text-gray-500">请在左侧输入学习数据，点击生成建议</p>
        </div>

        <div v-if="loading" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div class="text-4xl mb-4">🔄</div>
          <p class="text-gray-500">AI正在分析你的学习数据...</p>
          <div class="w-48 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <div class="h-full bg-indigo-600 rounded-full animate-pulse" style="width: 60%"></div>
          </div>
        </div>

        <div v-for="(s, i) in suggestions" :key="i" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
                :class="s.mastery < 40 ? 'bg-red-500' : s.mastery < 60 ? 'bg-amber-500' : 'bg-green-500'"
              >
                {{ s.mastery }}%
              </div>
              <h3 class="font-semibold text-gray-800">{{ s.point }}</h3>
            </div>
            <span
              class="text-xs px-2 py-0.5 rounded-full"
              :class="s.mastery < 40 ? 'bg-red-50 text-red-600' : s.mastery < 60 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'"
            >
              {{ s.mastery < 40 ? '薄弱' : s.mastery < 60 ? '待加强' : '良好' }}
            </span>
          </div>
          <div class="w-full h-2 bg-gray-100 rounded-full mb-3">
            <div class="h-full rounded-full transition-all duration-1000" :class="s.mastery < 40 ? 'bg-red-400' : s.mastery < 60 ? 'bg-amber-400' : 'bg-green-400'" :style="{ width: s.mastery + '%' }"></div>
          </div>
          <p class="text-sm text-gray-600">{{ s.suggestion }}</p>
        </div>

        <div v-if="suggestions.length > 0" class="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100">
          <p class="text-sm text-indigo-700">
            💡 <strong>AI建议：</strong>按照薄弱程度优先攻克函数与方程板块，建议每天安排30分钟专项训练，配合AI答疑随时解决疑难问题。
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
