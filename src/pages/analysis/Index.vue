<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type { Class } from '@/types'

const auth = useAuthStore()
const activeTab = ref<'overview' | 'grades'>('overview')
const timeRange = ref('week')

const allClasses = ref<Class[]>([])
const selectedClassId = ref('')
const classGrades = ref<any[]>([])

onMounted(async () => {
  allClasses.value = await api.getClasses()
  if (allClasses.value.length) selectedClassId.value = allClasses.value[0].id
  await loadClassGrades()
})

async function loadClassGrades() {
  if (!selectedClassId.value) return
  classGrades.value = await api.getClassGrades(selectedClassId.value)
}

const trendData = [
  { date: '05-01', avg: 72 }, { date: '05-05', avg: 75 }, { date: '05-10', avg: 73 },
  { date: '05-15', avg: 78 }, { date: '05-20', avg: 82 }, { date: '05-25', avg: 80 },
]

const radarData = [
  { topic: '函数', mastery: 75 }, { topic: '几何', mastery: 60 },
  { topic: '概率', mastery: 85 }, { topic: '数列', mastery: 55 },
  { topic: '向量', mastery: 70 }, { topic: '导数', mastery: 45 },
]

const topStudents = [
  { rank: 1, name: '李明', score: 95, change: '+5' },
  { rank: 2, name: '王芳', score: 92, change: '+3' },
  { rank: 3, name: '张伟', score: 88, change: '-2' },
  { rank: 4, name: '刘洋', score: 85, change: '+8' },
  { rank: 5, name: '陈静', score: 83, change: '+1' },
]

const weakPoints = [
  { topic: '导数与微分', rate: 68, level: '严重' },
  { topic: '数列综合', rate: 55, level: '偏弱' },
  { topic: '立体几何', rate: 48, level: '偏弱' },
  { topic: '三角函数', rate: 35, level: '一般' },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">学情分析中心</h1>
        <p class="text-sm text-gray-500 mt-1">整体学习情况概览</p>
      </div>
      <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
        <button v-for="t in [{k:'overview',l:'学情总览'},{k:'grades',l:'班级成绩'}]" :key="t.k"
          @click="activeTab = t.k as any"
          class="px-3 py-1.5 text-sm rounded-md transition-colors"
          :class="activeTab === t.k ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
        >{{ t.l }}</button>
      </div>
    </div>

    <!-- Overview Tab -->
    <template v-if="activeTab === 'overview'">
      <div class="flex items-center justify-between">
        <div class="flex gap-1 bg-gray-100 rounded-lg p-1">
          <button v-for="t in [{k:'week',l:'本周'},{k:'month',l:'本月'},{k:'semester',l:'本学期'}]" :key="t.k"
            @click="timeRange = t.k"
            class="px-3 py-1.5 text-xs rounded-md transition-colors"
            :class="timeRange === t.k ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-gray-500'"
          >{{ t.l }}</button>
        </div>
      </div>

      <div class="grid grid-cols-4 gap-4">
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">班级平均分</p>
          <p class="text-3xl font-bold text-indigo-600 mt-1">82.5</p>
          <p class="text-xs text-green-500 mt-1">↑ 较上周提升 3.2 分</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">最高分 / 最低分</p>
          <p class="text-3xl font-bold text-gray-800 mt-1">95 / 52</p>
          <p class="text-xs text-gray-400 mt-1">标准差 10.2</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">参考人数</p>
          <p class="text-3xl font-bold text-gray-800 mt-1">45</p>
          <p class="text-xs text-green-500 mt-1">全员参与</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">薄弱知识点</p>
          <p class="text-3xl font-bold text-red-500 mt-1">6</p>
          <p class="text-xs text-gray-400 mt-1">需要重点关注</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 class="font-semibold text-gray-800 mb-4">平均分趋势</h3>
          <div class="flex items-end gap-3 h-40">
            <div v-for="d in trendData" :key="d.date" class="flex-1 flex flex-col items-center gap-1">
              <span class="text-xs text-gray-400">{{ d.avg }}</span>
              <div class="w-full rounded-t-md transition-all" :style="{ height: d.avg * 2 + 'px' }"
                :class="d.avg >= 80 ? 'bg-green-400' : d.avg >= 70 ? 'bg-indigo-400' : 'bg-amber-400'">
              </div>
              <span class="text-xs text-gray-400">{{ d.date.slice(3) }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 class="font-semibold text-gray-800 mb-4">知识点掌握雷达</h3>
          <div class="space-y-3">
            <div v-for="r in radarData" :key="r.topic" class="flex items-center gap-3">
              <span class="text-sm text-gray-600 w-16">{{ r.topic }}</span>
              <div class="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :style="{ width: r.mastery + '%' }"
                  :class="r.mastery >= 70 ? 'bg-green-400' : r.mastery >= 50 ? 'bg-amber-400' : 'bg-red-400'">
                </div>
              </div>
              <span class="text-xs font-medium" :class="r.mastery >= 70 ? 'text-green-600' : r.mastery >= 50 ? 'text-amber-600' : 'text-red-600'">
                {{ r.mastery }}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100">
          <div class="p-4 border-b border-gray-100"><h3 class="font-semibold text-gray-800">学生排名 Top 5</h3></div>
          <div class="divide-y divide-gray-50">
            <div v-for="s in topStudents" :key="s.rank" class="flex items-center gap-3 p-3 hover:bg-gray-50">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                :class="s.rank === 1 ? 'bg-amber-100 text-amber-600' : s.rank === 2 ? 'bg-gray-100 text-gray-600' : s.rank === 3 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 text-gray-500'">
                {{ s.rank }}
              </div>
              <span class="text-sm text-gray-800 flex-1">{{ s.name }}</span>
              <span class="text-sm font-medium text-gray-800">{{ s.score }}分</span>
              <span class="text-xs" :class="s.change.startsWith('+') ? 'text-green-500' : 'text-red-500'">{{ s.change }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 class="font-semibold text-gray-800 mb-4">薄弱知识点分布</h3>
          <div class="space-y-3">
            <div v-for="w in weakPoints" :key="w.topic" class="flex items-center gap-3">
              <span class="text-sm text-gray-700 w-24">{{ w.topic }}</span>
              <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full text-xs text-white flex items-center justify-center font-medium"
                  :style="{ width: w.rate + '%' }"
                  :class="w.rate >= 60 ? 'bg-red-500' : w.rate >= 40 ? 'bg-amber-500' : 'bg-green-500'">
                  {{ w.rate }}%
                </div>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="w.level === '严重' ? 'bg-red-50 text-red-600' : w.level === '偏弱' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'">
                {{ w.level }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-linear-to-r from-indigo-50 to-blue-50 rounded-xl p-5 border border-indigo-100">
        <div class="flex items-center gap-2 mb-2"><span class="text-lg">🤖</span><span class="font-semibold text-indigo-700">AI 学情评语</span></div>
        <p class="text-sm text-indigo-900 leading-relaxed">
          班级整体表现良好，平均分稳步提升。函数模块掌握较好（75%），但导数与微分（45%）和数列（55%）仍需加强。
          建议在后续教学中：① 增加导数专题训练，结合图像理解导数的几何意义；② 强化数列综合题的解题策略训练。
        </p>
      </div>
    </template>

    <!-- Grades Tab - Only for teachers/admins -->
    <template v-if="activeTab === 'grades'">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">选择班级：</span>
        <select v-model="selectedClassId" @change="loadClassGrades" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
          <option v-for="c in allClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
        </select>
      </div>

      <div v-if="classGrades.length === 0" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <div class="text-5xl mb-4">📊</div>
        <p class="text-gray-500">暂无成绩数据</p>
      </div>
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left p-4 font-medium text-gray-600">学生</th>
              <th v-for="s in classGrades[0]?.scores || []" :key="s.exam" class="text-left p-4 font-medium text-gray-600">{{ s.exam }}</th>
              <th class="text-left p-4 font-medium text-gray-600">平均分</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="g in classGrades" :key="g.student_id" class="hover:bg-gray-50">
              <td class="p-4 font-medium text-gray-800">{{ g.nickname }}</td>
              <td v-for="s in g.scores" :key="s.exam" class="p-4">
                <span class="font-medium" :class="s.score !== null ? (s.score >= 60 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'">
                  {{ s.score !== null ? s.score : '-' }}
                </span>
              </td>
              <td class="p-4 font-medium text-indigo-600">{{ g.avg }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>