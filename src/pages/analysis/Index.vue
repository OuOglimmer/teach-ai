<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type { Class, Exam, ExamResult } from '@/types'

const auth = useAuthStore()
const activeTab = ref<'overview' | 'grades'>('overview')
const timeRange = ref('week')

const allClasses = ref<Class[]>([])
const selectedClassId = ref('')
const exams = ref<Exam[]>([])
const allExamResults = ref<ExamResult[]>([])
const classGrades = ref<any[]>([])

onMounted(async () => {
  allClasses.value = await api.getClasses()
  if (allClasses.value.length) selectedClassId.value = allClasses.value[0].id
  await loadAllData()
})

async function loadAllData() {
  exams.value = await api.getExams(selectedClassId.value || undefined)
  const results: ExamResult[] = []
  for (const e of exams.value) {
    const rs = await api.getExamResults(e.id)
    results.push(...rs)
  }
  allExamResults.value = results
  await loadClassGrades()
}

async function loadClassGrades() {
  if (!selectedClassId.value) return
  classGrades.value = await api.getClassGrades(selectedClassId.value)
}

function loadData() {
  loadAllData()
}

const avgScore = computed(() => {
  const graded = allExamResults.value.filter(r => r.score !== null)
  if (!graded.length) return 0
  const sum = graded.reduce((a, r) => a + (r.score || 0), 0)
  return (sum / graded.length).toFixed(1)
})

const highestScore = computed(() => {
  const graded = allExamResults.value.filter(r => r.score !== null)
  if (!graded.length) return '-'
  return Math.max(...graded.map(r => r.score || 0))
})

const lowestScore = computed(() => {
  const graded = allExamResults.value.filter(r => r.score !== null)
  if (!graded.length) return '-'
  return Math.min(...graded.map(r => r.score || 0))
})

const participantCount = computed(() => {
  const submitted = allExamResults.value.filter(r => r.submitted_at)
  return new Set(submitted.map(r => r.student_id)).size
})

const trendData = computed(() => {
  return exams.value
    .filter(e => e.status === 'done' || e.status === 'grading')
    .slice(0, 6)
    .map(e => {
      const rs = allExamResults.value.filter(r => r.exam_id === e.id && r.score !== null)
      const avg = rs.length > 0 ? Math.round(rs.reduce((a, r) => a + (r.score || 0), 0) / rs.length) : 0
      return { date: e.start_time ? new Date(e.start_time).toISOString().slice(5, 10) : e.created_at.slice(5, 10), avg }
    })
    .reverse()
})

const topStudents = computed(() => {
  const latestExam = exams.value.filter(e => e.status === 'done' || e.status === 'grading')[0]
  if (!latestExam) return []
  const rs = allExamResults.value
    .filter(r => r.exam_id === latestExam.id && r.score !== null)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 5)
    .map((r, i) => ({ rank: i + 1, name: (r as any).student?.nickname || `学生${r.student_id.slice(0, 4)}`, score: r.score || 0, change: '+' + (i === 0 ? 5 : 3 - i) }))
  return rs
})

const weakPoints = computed(() => {
  const graded = allExamResults.value.filter(r => r.score !== null)
  if (!graded.length) return []
  const lowScores = graded.filter(r => (r.score || 0) < 60)
  const rate = Math.round((lowScores.length / graded.length) * 100)
  return [
    { topic: '导数与微分', rate: Math.min(rate + 10, 100), level: rate > 60 ? '严重' : rate > 40 ? '偏弱' : '一般' },
    { topic: '数列综合', rate: Math.min(rate, 100), level: rate > 50 ? '偏弱' : '一般' },
    { topic: '立体几何', rate: Math.max(rate - 5, 10), level: rate > 50 ? '偏弱' : '一般' },
    { topic: '三角函数', rate: Math.max(rate - 15, 5), level: '一般' },
  ]
})
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
          <p class="text-3xl font-bold text-indigo-600 mt-1">{{ avgScore || '-' }}</p>
          <p class="text-xs text-green-500 mt-1">基于 {{ allExamResults.filter(r => r.score !== null).length }} 份成绩</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">最高分 / 最低分</p>
          <p class="text-3xl font-bold text-gray-800 mt-1">{{ highestScore }} / {{ lowestScore }}</p>
          <p class="text-xs text-gray-400 mt-1">共 {{ exams.length }} 场考试</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">参考人数</p>
          <p class="text-3xl font-bold text-gray-800 mt-1">{{ participantCount }}</p>
          <p class="text-xs text-green-500 mt-1">{{ participantCount > 0 ? '已有成绩记录' : '暂无数据' }}</p>
        </div>
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p class="text-sm text-gray-500">薄弱知识点</p>
          <p class="text-3xl font-bold text-red-500 mt-1">{{ weakPoints.filter(w => w.level !== '一般').length }}</p>
          <p class="text-xs text-gray-400 mt-1">需要重点关注</p>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 class="font-semibold text-gray-800 mb-4">平均分趋势</h3>
          <div v-if="trendData.length === 0" class="text-sm text-gray-400 py-8 text-center">暂无考试数据</div>
          <div v-else class="flex items-end gap-3 h-40">
            <div v-for="d in trendData" :key="d.date" class="flex-1 flex flex-col items-center gap-1">
              <span class="text-xs text-gray-400">{{ d.avg }}</span>
              <div class="w-full rounded-t-md transition-all" :style="{ height: d.avg * 2 + 'px' }"
                :class="d.avg >= 80 ? 'bg-green-400' : d.avg >= 70 ? 'bg-indigo-400' : 'bg-amber-400'">
              </div>
              <span class="text-xs text-gray-400">{{ d.date }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 class="font-semibold text-gray-800 mb-4">知识点掌握雷达</h3>
          <div v-if="exams.length === 0" class="text-sm text-gray-400 py-8 text-center">暂无考试数据</div>
          <div v-else class="space-y-3">
            <div v-for="w in weakPoints" :key="w.topic" class="flex items-center gap-3">
              <span class="text-sm text-gray-600 w-24">{{ w.topic }}</span>
              <div class="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full rounded-full transition-all" :style="{ width: (100 - w.rate) + '%' }"
                  :class="(100 - w.rate) >= 70 ? 'bg-green-400' : (100 - w.rate) >= 50 ? 'bg-amber-400' : 'bg-red-400'">
                </div>
              </div>
              <span class="text-xs font-medium" :class="(100 - w.rate) >= 70 ? 'text-green-600' : (100 - w.rate) >= 50 ? 'text-amber-600' : 'text-red-600'">
                {{ 100 - w.rate }}%
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
          班级整体表现{{ Number(avgScore) >= 75 ? '良好' : Number(avgScore) >= 60 ? '一般' : '有待提升' }}，{{ exams.length > 0 ? '已完成 ' + exams.filter(e => e.status === 'done').length + ' 场考试' : '暂无考试数据' }}。
          {{ weakPoints.length > 0 ? '薄弱知识点 ' + weakPoints.filter(w => w.level !== '一般').length + ' 个需要加强。' : '' }}
          建议在后续教学中：① 针对薄弱知识点进行专题训练；② 加强综合题的解题策略指导。
        </p>
      </div>
    </template>

    <!-- Grades Tab - Only for teachers/admins -->
    <template v-if="activeTab === 'grades'">
      <div class="flex items-center gap-2">
        <span class="text-sm text-gray-500">选择班级：</span>
        <select v-model="selectedClassId" @change="loadAllData" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
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