<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getUsageRecords, getMonthlyUsage, getMonthlyHistory,
  getMonthlyBudget, setMonthlyBudget,
  isServiceDisabled, enableService,
  clearAllRecords, type UsageRecord
} from '@/lib/usage-tracker'
import { globalRateLimiter } from '@/lib/rate-limiter'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const showBudgetInput = ref(false)
const budgetInput = ref('')
const currentBudget = ref(getMonthlyBudget())
const currentMonth = new Date().toISOString().slice(0, 7)

const monthlyUsage = computed(() => getMonthlyUsage())
const monthlyHistory = computed(() => getMonthlyHistory())
const allRecords = computed(() => getUsageRecords().reverse().slice(0, 200))
const serviceDisabled = computed(() => isServiceDisabled())

const budgetPercent = computed(() => {
  if (currentBudget.value <= 0) return 0
  return Math.min(100, (monthlyUsage.value.totalCost / currentBudget.value) * 100)
})

const budgetColor = computed(() => {
  if (budgetPercent.value >= 90) return 'text-red-600'
  if (budgetPercent.value >= 70) return 'text-amber-600'
  return 'text-green-600'
})

const barColor = computed(() => {
  if (budgetPercent.value >= 90) return 'bg-red-500'
  if (budgetPercent.value >= 70) return 'bg-amber-500'
  return 'bg-green-500'
})

onMounted(() => {
  currentBudget.value = getMonthlyBudget()
  budgetInput.value = String(currentBudget.value)
})

function saveBudget() {
  const val = parseFloat(budgetInput.value)
  if (isNaN(val) || val <= 0) return
  setMonthlyBudget(val)
  currentBudget.value = val
  showBudgetInput.value = false
}

function handleEnableService() {
  enableService()
}

function handleClearRecords() {
  if (confirm('确定清除所有用量记录？此操作不可恢复。')) {
    clearAllRecords()
  }
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(4)}`
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN')
}

function getCostLevel(cost: number): string {
  if (cost >= 0.01) return 'text-red-600 font-medium'
  if (cost >= 0.001) return 'text-amber-600'
  return 'text-gray-500'
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">API 用量统计</h1>
        <p class="text-sm text-gray-500 mt-1">DeepSeek API 使用情况与费用监控</p>
      </div>
      <button @click="handleClearRecords" class="px-3 py-1.5 text-xs text-gray-400 border border-gray-200 rounded-lg hover:text-red-500 hover:border-red-200 transition-colors">
        清除记录
      </button>
    </div>

    <!-- Service Disabled Alert -->
    <div v-if="serviceDisabled" class="bg-red-50 border border-red-200 rounded-xl p-5">
      <div class="flex items-center gap-3">
        <span class="text-3xl">🚫</span>
        <div class="flex-1">
          <p class="font-semibold text-red-800">API 服务已自动停用</p>
          <p class="text-sm text-red-600 mt-1">本月费用已超出预算上限，AI 答疑功能暂不可用。</p>
        </div>
        <button @click="handleEnableService" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600">
          重新启用
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-4 gap-4">
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">本月请求数</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ monthlyUsage.requestCount }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ currentMonth }}</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">本月 Token 消耗</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ monthlyUsage.totalTokens.toLocaleString() }}</p>
        <p class="text-xs text-gray-400 mt-1">输入+输出</p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">本月费用</p>
        <p class="text-2xl font-bold" :class="budgetColor">${{ monthlyUsage.totalCost.toFixed(4) }}</p>
        <p class="text-xs text-gray-400 mt-1">
          预算 ${{ currentBudget.toFixed(2) }}
          <button @click="showBudgetInput = !showBudgetInput" class="text-indigo-500 hover:text-indigo-600 ml-1">修改</button>
        </p>
      </div>
      <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500">速率限制状态</p>
        <p class="text-2xl font-bold text-gray-800 mt-1">{{ globalRateLimiter.remainingRequests }}/30</p>
        <p class="text-xs text-gray-400 mt-1">剩余/每分钟</p>
      </div>
    </div>

    <!-- Budget Edit -->
    <div v-if="showBudgetInput" class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-700">月度预算上限（USD）：</span>
        <input v-model="budgetInput" type="number" step="0.5" min="0.5"
          class="w-32 px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <button @click="saveBudget" class="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">保存</button>
        <button @click="showBudgetInput = false" class="px-4 py-1.5 text-sm text-gray-400 hover:text-gray-600">取消</button>
      </div>
    </div>

    <!-- Budget Progress Bar -->
    <div class="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-semibold text-gray-800">预算使用进度</h3>
        <span class="text-sm font-medium" :class="budgetColor">{{ budgetPercent.toFixed(1) }}%</span>
      </div>
      <div class="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
        <div class="h-full rounded-full transition-all duration-500" :class="barColor" :style="{ width: budgetPercent + '%' }"></div>
      </div>
      <div class="flex justify-between text-xs text-gray-400 mt-1">
        <span>$0</span>
        <span>${{ (currentBudget / 2).toFixed(2) }}</span>
        <span>${{ currentBudget.toFixed(2) }}</span>
      </div>
    </div>

    <!-- Monthly History -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100">
        <h3 class="font-semibold text-gray-800">月度历史</h3>
      </div>
      <table v-if="monthlyHistory.length" class="w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left p-3 font-medium text-gray-600">月份</th>
            <th class="text-left p-3 font-medium text-gray-600">请求数</th>
            <th class="text-left p-3 font-medium text-gray-600">Token 消耗</th>
            <th class="text-left p-3 font-medium text-gray-600">费用（USD）</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr v-for="m in monthlyHistory" :key="m.yearMonth" class="hover:bg-gray-50">
            <td class="p-3 font-medium text-gray-800">{{ m.yearMonth }}</td>
            <td class="p-3 text-gray-600">{{ m.requestCount }}</td>
            <td class="p-3 text-gray-600">{{ m.totalTokens.toLocaleString() }}</td>
            <td class="p-3 font-medium" :class="m.totalCost >= 1 ? 'text-red-600' : 'text-gray-800'">${{ m.totalCost.toFixed(4) }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="p-8 text-center text-gray-400">暂无数据</p>
    </div>

    <!-- Recent Records -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-4 border-b border-gray-100 flex justify-between items-center">
        <h3 class="font-semibold text-gray-800">最近 API 调用记录</h3>
        <span class="text-xs text-gray-400">显示最近 200 条</span>
      </div>
      <div class="overflow-x-auto max-h-96 overflow-y-auto">
        <table v-if="allRecords.length" class="w-full text-sm">
          <thead class="bg-gray-50 sticky top-0">
            <tr>
              <th class="text-left p-3 font-medium text-gray-600">时间</th>
              <th class="text-left p-3 font-medium text-gray-600">模型</th>
              <th class="text-left p-3 font-medium text-gray-600">输入 Tokens</th>
              <th class="text-left p-3 font-medium text-gray-600">输出 Tokens</th>
              <th class="text-left p-3 font-medium text-gray-600">总 Tokens</th>
              <th class="text-left p-3 font-medium text-gray-600">费用</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="r in allRecords" :key="r.id" class="hover:bg-gray-50">
              <td class="p-3 text-gray-500 text-xs">{{ formatDate(r.timestamp) }}</td>
              <td class="p-3 text-gray-700 text-xs">{{ r.model }}</td>
              <td class="p-3 text-gray-600">{{ r.inputTokens }}</td>
              <td class="p-3 text-gray-600">{{ r.outputTokens }}</td>
              <td class="p-3 text-gray-800 font-medium">{{ r.totalTokens }}</td>
              <td class="p-3 text-xs" :class="getCostLevel(r.cost)">{{ formatCost(r.cost) }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="p-8 text-center text-gray-400">暂无 API 调用记录，开始对话后自动记录</p>
      </div>
    </div>

    <!-- Info -->
    <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <div class="flex items-start gap-2">
        <span class="text-lg">ℹ️</span>
        <div class="text-sm text-blue-800">
          <p class="font-medium mb-1">费用说明</p>
          <p>DeepSeek 模型定价（估算）：输入 $0.14/百万 tokens，输出 $0.28/百万 tokens。</p>
          <p class="mt-1">Token 数为估算值（中文字符约 2 tokens/字）。速率限制为每分钟最多 30 次请求。</p>
          <p class="mt-1">可在 <code class="bg-blue-100 px-1 rounded">.env</code> 中设置 <code>VITE_APP_ENV=development</code> 使用独立环境 Key。</p>
        </div>
      </div>
    </div>
  </div>
</template>