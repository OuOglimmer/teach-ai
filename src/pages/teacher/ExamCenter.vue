<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/lib/api'
import type { Exam, Homework, Class, ExamResult, HomeworkSubmission } from '@/types'

const auth = useAuthStore()
const activeTab = ref<'exams' | 'homework' | 'analysis'>('exams')

const allClasses = ref<Class[]>([])
const exams = ref<Exam[]>([])
const homeworkList = ref<Homework[]>([])
const selectedClass = ref<string>('')
const showCreateExam = ref(false)
const showCreateHomework = ref(false)
const showExamResults = ref(false)
const showHomeworkSubmissions = ref(false)
const selectedExamId = ref('')
const selectedHomeworkId = ref('')
const examResults = ref<ExamResult[]>([])
const homeworkSubmissions = ref<HomeworkSubmission[]>([])
const gradingScore = ref<Record<string, number>>({})

const newExam = ref({ title: '', class_id: '', duration: 60, total_score: 100, start_time: '', end_time: '' })
const newHomework = ref({ title: '', class_id: '', description: '', due_date: '', total_score: 100 })

const loading = ref(false)

onMounted(async () => {
  allClasses.value = await api.getClasses()
  await loadData()
})

async function loadData() {
  exams.value = await api.getExams(selectedClass.value || undefined)
  homeworkList.value = await api.getHomework(selectedClass.value || undefined)
}

async function createExam() {
  if (!newExam.value.title || !newExam.value.class_id) return
  loading.value = true
  await api.createExam({
    ...newExam.value,
    teacher_id: auth.user?.id || '',
    questions: [],
    status: 'draft'
  })
  await loadData()
  showCreateExam.value = false
  newExam.value = { title: '', class_id: '', duration: 60, total_score: 100, start_time: '', end_time: '' }
  loading.value = false
}

async function createHomework() {
  if (!newHomework.value.title || !newHomework.value.class_id) return
  loading.value = true
  await api.createHomework({
    ...newHomework.value,
    teacher_id: auth.user?.id || '',
    status: 'draft'
  })
  await loadData()
  showCreateHomework.value = false
  newHomework.value = { title: '', class_id: '', description: '', due_date: '', total_score: 100 }
  loading.value = false
}

async function publishExam(id: string) {
  await api.updateExam?.(id, { status: 'published' } as any)
  await loadData()
}

async function publishHomework(id: string) {
  await api.updateHomeworkStatus(id, 'published')
  await loadData()
}

async function viewExamResults(examId: string) {
  selectedExamId.value = examId
  examResults.value = await api.getExamResults(examId)
  showExamResults.value = true
}

async function viewHomeworkSubmissions(homeworkId: string) {
  selectedHomeworkId.value = homeworkId
  homeworkSubmissions.value = await api.getHomeworkSubmissions(homeworkId)
  showHomeworkSubmissions.value = true
}

async function gradeSubmission(id: string) {
  const score = gradingScore.value[id]
  if (score === undefined || score < 0) return
  await api.gradeSubmission(id, score)
  homeworkSubmissions.value = await api.getHomeworkSubmissions(selectedHomeworkId.value)
}

const statusMap: Record<string, string> = {
  draft: '草稿', published: '已发布', grading: '批改中', done: '已完成', closed: '已截止'
}
const statusColor: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  published: 'bg-blue-100 text-blue-600',
  grading: 'bg-amber-100 text-amber-600',
  done: 'bg-green-100 text-green-600',
  closed: 'bg-red-100 text-red-600',
}

const wrongHotData = [
  { topic: '二次函数图像', count: 28, rate: 62 },
  { topic: '三角函数恒等变换', count: 22, rate: 49 },
  { topic: '数列求和', count: 18, rate: 40 },
  { topic: '立体几何证明', count: 15, rate: 33 },
  { topic: '概率计算', count: 10, rate: 22 },
]
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-800">作业与考试中心</h1>
      <div class="flex gap-2">
        <button @click="showCreateHomework = true" class="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">发布作业</button>
        <button @click="showCreateExam = true" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">组卷考试</button>
      </div>
    </div>

    <div class="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      <button v-for="tab in [{k:'exams',l:'考试列表'},{k:'homework',l:'作业管理'},{k:'analysis',l:'错题分析'}]" :key="tab.k"
        @click="activeTab = tab.k as any"
        class="px-4 py-2 text-sm rounded-md transition-colors"
        :class="activeTab === tab.k ? 'bg-white shadow-sm font-medium text-indigo-600' : 'text-gray-500 hover:text-gray-700'"
      >{{ tab.l }}</button>
    </div>

    <!-- Class Filter -->
    <div class="flex items-center gap-2">
      <span class="text-sm text-gray-500">筛选班级：</span>
      <select v-model="selectedClass" @change="loadData" class="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
        <option value="">全部班级</option>
        <option v-for="c in allClasses" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
    </div>

    <!-- Create Exam Modal -->
    <div v-if="showCreateExam" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">创建考试</h3>
        <div class="space-y-3">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">考试名称</label><input v-model="newExam.title" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">班级</label><select v-model="newExam.class_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="">选择班级</option><option v-for="c in allClasses" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">时长(分钟)</label><input v-model.number="newExam.duration" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">总分</label><input v-model.number="newExam.total_score" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">开始时间</label><input v-model="newExam.start_time" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">结束时间</label><input v-model="newExam.end_time" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          </div>
        </div>
        <div class="flex gap-2 mt-6 justify-end">
          <button @click="showCreateExam = false" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">取消</button>
          <button @click="createExam" :disabled="loading" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">创建考试</button>
        </div>
      </div>
    </div>

    <!-- Create Homework Modal -->
    <div v-if="showCreateHomework" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">发布作业</h3>
        <div class="space-y-3">
          <div><label class="block text-sm font-medium text-gray-700 mb-1">作业标题</label><input v-model="newHomework.title" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">班级</label><select v-model="newHomework.class_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"><option value="">选择班级</option><option v-for="c in allClasses" :key="c.id" :value="c.id">{{ c.name }}</option></select></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1">作业描述</label><textarea v-model="newHomework.description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"></textarea></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="block text-sm font-medium text-gray-700 mb-1">截止日期</label><input v-model="newHomework.due_date" type="datetime-local" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
            <div><label class="block text-sm font-medium text-gray-700 mb-1">总分</label><input v-model.number="newHomework.total_score" type="number" class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" /></div>
          </div>
        </div>
        <div class="flex gap-2 mt-6 justify-end">
          <button @click="showCreateHomework = false" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm">取消</button>
          <button @click="createHomework" :disabled="loading" class="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">发布作业</button>
        </div>
      </div>
    </div>

    <!-- Exams Tab -->
    <div v-if="activeTab === 'exams'">
      <div v-if="exams.length === 0" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <div class="text-5xl mb-4">📋</div>
        <p class="text-gray-500">暂无考试数据</p>
      </div>
      <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left p-4 font-medium text-gray-600">考试名称</th>
              <th class="text-left p-4 font-medium text-gray-600">班级</th>
              <th class="text-left p-4 font-medium text-gray-600">状态</th>
              <th class="text-left p-4 font-medium text-gray-600">总分</th>
              <th class="text-left p-4 font-medium text-gray-600">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="exam in exams" :key="exam.id" class="hover:bg-gray-50">
              <td class="p-4 font-medium text-gray-800">{{ exam.title }}</td>
              <td class="p-4 text-gray-600">{{ (exam as any).class?.name || '-' }}</td>
              <td class="p-4"><span class="px-2 py-0.5 text-xs rounded-full" :class="statusColor[exam.status]">{{ statusMap[exam.status] }}</span></td>
              <td class="p-4 text-gray-800">{{ exam.total_score }}</td>
              <td class="p-4 flex gap-2">
                <button v-if="exam.status === 'draft'" @click="publishExam(exam.id)" class="text-blue-600 hover:text-blue-700 text-xs">发布</button>
                <button @click="viewExamResults(exam.id)" class="text-indigo-600 hover:text-indigo-700 text-xs">查看成绩</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Exam Results Modal -->
    <div v-if="showExamResults" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">考试成绩</h3>
          <button @click="showExamResults = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <table v-if="examResults.length" class="w-full text-sm">
          <thead class="bg-gray-50"><tr><th class="text-left p-3 font-medium text-gray-600">学生</th><th class="text-left p-3 font-medium text-gray-600">得分</th><th class="text-left p-3 font-medium text-gray-600">提交时间</th></tr></thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in examResults" :key="r.id" class="hover:bg-gray-50">
              <td class="p-3 font-medium text-gray-800">{{ (r as any).student?.nickname || '未知' }}</td>
              <td class="p-3"><span class="font-medium" :class="r.score !== null ? (r.score >= 60 ? 'text-green-600' : 'text-red-600') : 'text-gray-400'">{{ r.score !== null ? r.score : '未批改' }}</span></td>
              <td class="p-3 text-gray-500">{{ new Date(r.submitted_at).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="text-gray-500 text-center py-8">暂无成绩数据</p>
      </div>
    </div>

    <!-- Homework Tab -->
    <div v-if="activeTab === 'homework'">
      <div v-if="homeworkList.length === 0" class="bg-white rounded-xl p-12 shadow-sm border border-gray-100 text-center">
        <div class="text-5xl mb-4">📝</div>
        <p class="text-gray-500">暂无作业数据</p>
      </div>
      <div v-else class="grid grid-cols-2 gap-4">
        <div v-for="hw in homeworkList" :key="hw.id" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold text-gray-800">{{ hw.title }}</h3>
              <p class="text-xs text-gray-400">{{ (hw as any).class?.name || '-' }} · 截止 {{ new Date(hw.due_date).toLocaleDateString() }}</p>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full" :class="statusColor[hw.status]">{{ statusMap[hw.status] }}</span>
          </div>
          <p class="text-sm text-gray-500 mb-3 line-clamp-2">{{ hw.description }}</p>
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">总分: {{ hw.total_score }}</span>
            <div class="flex gap-2">
              <button v-if="hw.status === 'draft'" @click="publishHomework(hw.id)" class="text-blue-600 hover:text-blue-700 text-xs">发布</button>
              <button @click="viewHomeworkSubmissions(hw.id)" class="text-indigo-600 hover:text-indigo-700 text-xs">批改</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Homework Submissions Modal -->
    <div v-if="showHomeworkSubmissions" class="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div class="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">作业提交批改</h3>
          <button @click="showHomeworkSubmissions = false" class="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div v-if="homeworkSubmissions.length === 0" class="text-gray-500 text-center py-8">暂无提交记录</div>
        <div v-else class="space-y-4">
          <div v-for="sub in homeworkSubmissions" :key="sub.id" class="p-4 bg-gray-50 rounded-lg">
            <div class="flex justify-between items-start mb-2">
              <div>
                <p class="font-medium text-gray-800">{{ (sub as any).student?.nickname || '未知' }}</p>
                <p class="text-xs text-gray-400">{{ new Date(sub.submitted_at).toLocaleString() }}</p>
              </div>
              <span v-if="sub.graded" class="text-sm font-medium" :class="(sub.score || 0) >= 60 ? 'text-green-600' : 'text-red-600'">{{ sub.score }}分</span>
            </div>
            <p class="text-sm text-gray-600 bg-white p-3 rounded">{{ sub.content }}</p>
            <div v-if="!sub.graded" class="flex gap-2 mt-3 items-center">
              <input v-model.number="gradingScore[sub.id]" type="number" placeholder="评分" class="w-24 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
              <button @click="gradeSubmission(sub.id)" class="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700">提交评分</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Wrong question analysis -->
    <div v-if="activeTab === 'analysis'" class="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 class="font-semibold text-gray-800 mb-4">错题热力图</h3>
      <div class="space-y-3">
        <div v-for="w in wrongHotData" :key="w.topic" class="flex items-center gap-4">
          <span class="text-sm text-gray-700 w-32">{{ w.topic }}</span>
          <div class="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
            <div class="h-full rounded-full flex items-center justify-center text-xs text-white font-medium transition-all"
              :style="{ width: w.rate + '%' }"
              :class="w.rate > 50 ? 'bg-red-500' : w.rate > 30 ? 'bg-amber-500' : 'bg-green-500'"
            >{{ w.rate }}%</div>
          </div>
          <span class="text-xs text-gray-400 w-16 text-right">{{ w.count }}人</span>
        </div>
      </div>
    </div>
  </div>
</template>