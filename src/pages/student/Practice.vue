<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'

const auth = useAuthStore()
const loading = ref(false)
const generated = ref<any>(null)

const typeLabels: Record<string, string> = { choice: '选择题', fill: '填空题', essay: '解答题' }

const form = ref({
  subject: '数学',
  difficulty: 'medium',
  topics: '二次函数,三角函数',
})

function generate() {
  loading.value = true
  setTimeout(async () => {
    generated.value = {
      title: `${form.value.subject} · ${form.value.difficulty === 'easy' ? '基础' : form.value.difficulty === 'medium' ? '提高' : '挑战'}练习卷`,
      total_score: 100,
      estimated_time: 45,
      questions: [
        { id: 1, type: 'choice', content: '已知二次函数 $f(x)=x^2-2x+3$，求其最小值', options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'], score: 10 },
        { id: 2, type: 'choice', content: '函数 $y=\\sin(2x+\\frac{\\pi}{3})$ 的最小正周期为', options: ['A. $\\pi$', 'B. $2\\pi$', 'C. $\\frac{\\pi}{2}$', 'D. $\\frac{\\pi}{3}$'], score: 10 },
        { id: 3, type: 'fill', content: '若 $\\tan\\alpha=2$，则 $\\frac{\\sin\\alpha-\\cos\\alpha}{\\sin\\alpha+\\cos\\alpha}$ 的值为 ______', score: 15 },
        { id: 4, type: 'essay', content: '已知函数 $f(x)=x^2-2ax+1$ 在区间 $[0,2]$ 上的最小值为 $-3$，求实数 $a$ 的值。', score: 25 },
        { id: 5, type: 'essay', content: '在 $\\triangle ABC$ 中，角 $A,B,C$ 的对边分别为 $a,b,c$，且 $b^2=ac$，求证：$B\\leq \\frac{\\pi}{3}$。', score: 25 },
      ],
    }
    loading.value = false
  }, 1500)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-800">个性化练习</h1>
      <p class="text-sm text-gray-500 mt-1">AI根据学情智能定制专属提分练习，精准匹配薄弱点</p>
    </div>

    <div class="grid grid-cols-3 gap-6">
      <div class="col-span-1 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-4">练习设置</h3>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">学科</label>
            <select v-model="form.subject" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>数学</option>
              <option>语文</option>
              <option>英语</option>
              <option>物理</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">难度</label>
            <div class="flex gap-2">
              <button v-for="d in [{k:'easy',l:'基础'},{k:'medium',l:'提高'},{k:'hard',l:'挑战'}]" :key="d.k"
                @click="form.difficulty = d.k"
                class="flex-1 py-2 rounded-lg text-sm border transition-colors"
                :class="form.difficulty === d.k ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300'"
              >{{ d.l }}</button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">知识点范围（逗号分隔）</label>
            <textarea v-model="form.topics" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>
          <button
            @click="generate" :disabled="loading"
            class="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {{ loading ? 'AI生成中...' : '生成练习卷' }}
          </button>
        </div>
      </div>

      <div class="col-span-2 space-y-4">
        <div v-if="!generated && !loading" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
          <div class="text-6xl mb-4">📝</div>
          <p class="text-gray-500">设置参数后，AI将为你生成专属练习卷</p>
        </div>

        <div v-if="loading" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <div class="text-4xl mb-4">🤖</div>
          <p class="text-gray-500">AI正在根据你的学情智能组卷...</p>
          <div class="w-48 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
            <div class="h-full bg-indigo-600 rounded-full animate-pulse" style="width: 75%"></div>
          </div>
        </div>

        <div v-if="generated" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div class="bg-linear-to-r from-indigo-500 to-purple-600 p-5 text-white">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-semibold">{{ generated.title }}</h3>
                <p class="text-sm text-indigo-100 mt-1">总分 {{ generated.total_score }} 分 · 预计 {{ generated.estimated_time }} 分钟</p>
              </div>
              <button class="px-4 py-2 bg-white text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50">开始答题</button>
            </div>
          </div>
          <div class="p-5 space-y-4">
              <div v-for="(q, i) in generated.questions" :key="q.id" class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">{{ Number(i) + 1 }}</span>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                      {{ typeLabels[q.type as string] || q.type }}
                    </span>
                  </div>
                <span class="text-xs text-gray-400">{{ q.score }}分</span>
              </div>
              <p class="text-sm text-gray-800" v-html="q.content"></p>
              <div v-if="q.options" class="mt-2 space-y-1">
                <p v-for="opt in q.options" :key="opt" class="text-sm text-gray-600">{{ opt }}</p>
              </div>
            </div>
          </div>
        </div>

        <p v-if="generated" class="text-center text-sm text-gray-400 italic">
          "拒绝盲目刷题，智能匹配弱点"
        </p>
      </div>
    </div>
  </div>
</template>
