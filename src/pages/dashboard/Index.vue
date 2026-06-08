<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type { Exam, Homework } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const exams = ref<Exam[]>([])
const homeworkList = ref<Homework[]>([])
const studentGrades = ref<{ exam_title: string; score: number; total: number; date: string }[]>([])

onMounted(async () => {
  if (auth.isTeacher || auth.isAdmin) {
    exams.value = (await api.getExams()).filter(e => e.status !== 'draft')
    homeworkList.value = (await api.getHomework()).filter(h => h.status !== 'draft')
  }
  if (auth.isStudent && auth.user) {
    studentGrades.value = await api.getStudentGrades(auth.user.id)
  }
})

const pendingCount = computed(() => {
  if (auth.isTeacher || auth.isAdmin) {
    const grading = exams.value.filter(e => e.status === 'grading').length
    return grading
  }
  return 0
})

const recentExams = computed(() => exams.value.slice(0, 3))
const recentHomework = computed(() => homeworkList.value.slice(0, 3))

const today = new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">工作台首页</h1>
        <p class="text-sm text-gray-500 mt-1">AI启航教育 · 欢迎回来，{{ auth.user?.nickname || '用户' }}</p>
      </div>
      <div class="text-sm text-gray-400">{{ today }}</div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">{{ auth.isStudent ? '我的考试' : '待批考试' }}</p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-2xl font-bold text-gray-800">{{ auth.isStudent ? studentGrades.length : pendingCount }}</span>
          <span class="text-xs text-gray-400">{{ auth.isStudent ? '次考试' : '场待批' }}</span>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">{{ auth.isStudent ? '已提交作业' : '待批作业' }}</p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-2xl font-bold text-gray-800">{{ auth.isStudent ? studentGrades.filter(g => g.score !== null).length : homeworkList.filter(h => h.status === 'published').length }}</span>
          <span class="text-xs text-gray-400">项</span>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">{{ auth.isStudent ? '平均成绩' : '班级数' }}</p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-2xl font-bold text-gray-800">{{ auth.isStudent ? (studentGrades.length ? Math.round(studentGrades.reduce((a, b) => a + (b.score || 0), 0) / studentGrades.length) : '-') : '2' }}</span>
          <span class="text-xs text-gray-400">{{ auth.isStudent ? '分' : '个' }}</span>
        </div>
      </div>
      <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">{{ auth.isStudent ? 'AI答疑' : '总考试数' }}</p>
        <div class="flex items-baseline gap-2 mt-1">
          <span class="text-2xl font-bold text-indigo-600">{{ auth.isStudent ? '5' : exams.length }}</span>
          <span class="text-xs text-green-500">+{{ auth.isStudent ? 2 : 1 }}</span>
        </div>
      </div>
    </div>

    <!-- Student Grades -->
    <div v-if="auth.isStudent && studentGrades.length" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <h3 class="font-semibold text-gray-800 mb-3">我的成绩</h3>
      <div class="space-y-3">
        <div v-for="g in studentGrades.slice(0, 5)" :key="g.exam_title" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
          <span class="text-sm text-gray-700">{{ g.exam_title }}</span>
          <div class="flex items-center gap-3">
            <div class="w-24 h-2 bg-gray-100 rounded-full">
              <div class="h-full rounded-full" :class="(g.score / g.total) >= 0.6 ? 'bg-green-400' : 'bg-red-400'" :style="{ width: (g.score / g.total * 100) + '%' }"></div>
            </div>
            <span class="text-sm font-medium" :class="(g.score / g.total) >= 0.6 ? 'text-green-600' : 'text-red-600'">{{ g.score }}/{{ g.total }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Teacher/Admin: Recent Exams & Homework -->
    <template v-if="auth.isTeacher || auth.isAdmin">
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-semibold text-gray-800">最近考试</h3>
            <button @click="router.push('/teacher/exams')" class="text-xs text-indigo-600 hover:text-indigo-700">查看全部 →</button>
          </div>
          <div v-if="recentExams.length === 0" class="text-sm text-gray-400 py-4 text-center">暂无考试</div>
          <div v-else class="space-y-3">
            <div v-for="e in recentExams" :key="e.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p class="text-sm font-medium text-gray-800">{{ e.title }}</p>
                <p class="text-xs text-gray-400">{{ (e as any).class?.name || '-' }}</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full"
                :class="e.status === 'grading' ? 'bg-amber-100 text-amber-600' : e.status === 'published' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'">
                {{ e.status === 'grading' ? '批改中' : e.status === 'published' ? '进行中' : '已完成' }}
              </span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div class="flex justify-between items-center mb-3">
            <h3 class="font-semibold text-gray-800">最近作业</h3>
            <button @click="router.push('/teacher/exams')" class="text-xs text-indigo-600 hover:text-indigo-700">查看全部 →</button>
          </div>
          <div v-if="recentHomework.length === 0" class="text-sm text-gray-400 py-4 text-center">暂无作业</div>
          <div v-else class="space-y-3">
            <div v-for="h in recentHomework" :key="h.id" class="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div>
                <p class="text-sm font-medium text-gray-800">{{ h.title }}</p>
                <p class="text-xs text-gray-400">截止 {{ new Date(h.due_date).toLocaleDateString() }}</p>
              </div>
              <span class="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-600">{{ h.status === 'published' ? '已发布' : '已截止' }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Student: Learning modules -->
    <template v-if="auth.isStudent">
      <div>
        <h2 class="text-lg font-semibold text-gray-800 mb-4">学生学习辅导</h2>
        <div class="grid grid-cols-3 gap-6">
          <div v-for="card in [
            { title: 'AI答疑', desc: '7×24小时智能答疑，即时解答知识难点', icon: '💬', color: 'from-blue-400 to-blue-600', path: '/student/qa' },
            { title: '学习建议', desc: '基于多维度数据生成定制化学习优化建议', icon: '💡', color: 'from-amber-400 to-orange-500', path: '/student/suggestions' },
            { title: '个性化练习', desc: '智能定制专属提分练习，拒绝盲目刷题', icon: '✏️', color: 'from-emerald-400 to-teal-500', path: '/student/practice' },
          ]" :key="card.title"
            @click="router.push(card.path)"
            class="bg-white rounded-xl p-6 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-linear-to-br" :class="card.color">{{ card.icon }}</div>
              <h3 class="font-semibold text-gray-800">{{ card.title }}</h3>
            </div>
            <p class="text-sm text-gray-500">{{ card.desc }}</p>
            <div class="mt-4 flex items-center text-sm text-indigo-600 font-medium">立即使用 →</div>
          </div>
        </div>
      </div>
    </template>

    <!-- Quick actions + Recent activity -->
    <div class="grid grid-cols-2 gap-6">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-3">快捷操作</h3>
        <div class="grid grid-cols-2 gap-3">
          <button @click="router.push('/student/qa')" class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">💬 发起AI答疑</button>
          <button @click="router.push(auth.isStudent ? '/student/practice' : '/teacher/exams')" class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">{{ auth.isStudent ? '✏️ 开始练习' : '📋 发布作业' }}</button>
          <button @click="router.push('/analysis')" class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">📈 查看学情</button>
          <button @click="router.push('/teacher/resources')" class="p-3 bg-gray-50 rounded-lg text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 text-left transition-colors">📁 教学资源</button>
        </div>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 class="font-semibold text-gray-800 mb-3">最近动态</h3>
        <div class="space-y-3">
          <div class="flex items-center gap-3 text-sm">
            <span class="w-2 h-2 bg-green-400 rounded-full"></span>
            <span class="text-gray-600">{{ auth.isStudent ? '你已提交数学作业' : '张三提交了数学作业' }}</span>
            <span class="text-gray-400 ml-auto">2分钟前</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="w-2 h-2 bg-blue-400 rounded-full"></span>
            <span class="text-gray-600">AI答疑完成3条新回复</span>
            <span class="text-gray-400 ml-auto">15分钟前</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="w-2 h-2 bg-amber-400 rounded-full"></span>
            <span class="text-gray-600">系统生成新的学习建议报告</span>
            <span class="text-gray-400 ml-auto">1小时前</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>