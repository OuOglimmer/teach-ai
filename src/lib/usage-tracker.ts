const STORAGE_KEY = 'ai_usage_records'
const BUDGET_KEY = 'ai_monthly_budget'
const DISABLED_KEY = 'ai_service_disabled'

export interface UsageRecord {
  id: string
  timestamp: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
  cost: number
  model: string
}

interface MonthlyUsage {
  yearMonth: string
  totalCost: number
  totalTokens: number
  requestCount: number
}

const PRICE_PER_1M_INPUT = 0.14
const PRICE_PER_1M_OUTPUT = 0.28

export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCost = (inputTokens / 1_000_000) * PRICE_PER_1M_INPUT
  const outputCost = (outputTokens / 1_000_000) * PRICE_PER_1M_OUTPUT
  return inputCost + outputCost
}

export function getUsageRecords(): UsageRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export function addUsageRecord(record: UsageRecord) {
  const records = getUsageRecords()
  records.push(record)
  const maxRecords = 10000
  const trimmed = records.length > maxRecords ? records.slice(-maxRecords) : records
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function getMonthlyUsage(yearMonth?: string): MonthlyUsage {
  const now = yearMonth || new Date().toISOString().slice(0, 7)
  const records = getUsageRecords()
  const monthRecords = records.filter(r => r.id.startsWith(now))

  return {
    yearMonth: now,
    totalCost: monthRecords.reduce((s, r) => s + r.cost, 0),
    totalTokens: monthRecords.reduce((s, r) => s + r.totalTokens, 0),
    requestCount: monthRecords.length
  }
}

export function getMonthlyHistory(): MonthlyUsage[] {
  const records = getUsageRecords()
  const monthMap = new Map<string, MonthlyUsage>()

  for (const r of records) {
    const ym = r.id.slice(0, 7)
    const existing = monthMap.get(ym) || { yearMonth: ym, totalCost: 0, totalTokens: 0, requestCount: 0 }
    existing.totalCost += r.cost
    existing.totalTokens += r.totalTokens
    existing.requestCount++
    monthMap.set(ym, existing)
  }

  return Array.from(monthMap.values()).sort((a, b) => b.yearMonth.localeCompare(a.yearMonth))
}

export function getMonthlyBudget(): number {
  const v = localStorage.getItem(BUDGET_KEY)
  return v ? parseFloat(v) : 5.0
}

export function setMonthlyBudget(usd: number) {
  localStorage.setItem(BUDGET_KEY, String(usd))
}

export function isServiceDisabled(): boolean {
  try {
    const raw = localStorage.getItem(DISABLED_KEY)
    if (!raw) return false
    const data = JSON.parse(raw)
    if (data.type === 'budget_exceeded') {
      const budgetMonth = data.month
      const currentMonth = new Date().toISOString().slice(0, 7)
      if (budgetMonth !== currentMonth) {
        localStorage.removeItem(DISABLED_KEY)
        return false
      }
      return true
    }
    return false
  } catch {
    return false
  }
}

export function disableService(reason: string, month: string) {
  localStorage.setItem(DISABLED_KEY, JSON.stringify({ type: reason, month }))
}

export function enableService() {
  localStorage.removeItem(DISABLED_KEY)
}

export function checkBudgetAndDisable(): { withinBudget: boolean; currentCost: number; budget: number } {
  const budget = getMonthlyBudget()
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthly = getMonthlyUsage(currentMonth)

  if (monthly.totalCost >= budget) {
    disableService('budget_exceeded', currentMonth)
    return { withinBudget: false, currentCost: monthly.totalCost, budget }
  }

  return { withinBudget: true, currentCost: monthly.totalCost, budget }
}

export function clearAllRecords() {
  localStorage.removeItem(STORAGE_KEY)
}
