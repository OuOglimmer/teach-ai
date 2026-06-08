import { api } from './api'
import { globalRateLimiter } from './rate-limiter'
import {
  addUsageRecord,
  calculateCost,
  checkBudgetAndDisable,
  isServiceDisabled,
  type UsageRecord
} from './usage-tracker'

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamCallbacks {
  onToken: (token: string) => void
  onDone: (fullContent: string) => void
  onError: (error: Error) => void
}

export interface DeepSeekConfig {
  maxTokens?: number
  temperature?: number
  model?: string
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'
const VAULT_SECRET_NAME = 'deepseek_api_key'

let cachedKey: string | null = null

function getEnvSuffix(): string {
  const env = import.meta.env.VITE_APP_ENV || 'production'
  if (env === 'development') return '_DEV'
  if (env === 'staging') return '_STG'
  return ''
}

async function getApiKey(): Promise<string> {
  if (cachedKey) return cachedKey

  const suffix = getEnvSuffix()
  const vaultName = VAULT_SECRET_NAME + suffix
  const envVar = `VITE_DEEPSEEK_API_KEY${suffix}` as keyof ImportMetaEnv

  const fromVault = await api.getVaultSecret(vaultName)
  if (fromVault) {
    cachedKey = fromVault
    return fromVault
  }

  const fromEnv = import.meta.env[envVar] as string || import.meta.env.VITE_DEEPSEEK_API_KEY || ''
  if (fromEnv) {
    cachedKey = fromEnv
    return fromEnv
  }

  return ''
}

export async function hasApiKey(): Promise<boolean> {
  return !!(await getApiKey())
}

export function clearKeyCache() {
  cachedKey = null
}

export async function streamChat(
  messages: DeepSeekMessage[],
  callbacks: StreamCallbacks,
  options?: { signal?: AbortSignal; config?: DeepSeekConfig }
) {
  if (isServiceDisabled()) {
    callbacks.onError(new Error('本月的 API 预算已耗尽，服务已自动停用。请前往用量统计页面调整预算或等待下月重置。'))
    return
  }

  const budgetCheck = checkBudgetAndDisable()
  if (!budgetCheck.withinBudget) {
    callbacks.onError(new Error(`本月 API 费用 $${budgetCheck.currentCost.toFixed(2)} 已超过预算 $${budgetCheck.budget.toFixed(2)}，服务已停用。`))
    return
  }

  if (!globalRateLimiter.tryAcquire()) {
    const resetMs = globalRateLimiter.resetTime - Date.now()
    const resetSec = Math.ceil(resetMs / 1000)
    callbacks.onError(new Error(`请求过于频繁，请在 ${resetSec} 秒后重试（每分钟最多 30 次请求）。`))
    return
  }

  const apiKey = await getApiKey()
  if (!apiKey) {
    callbacks.onError(new Error('请先配置 DeepSeek API Key'))
    return
  }

  const config = options?.config || {}
  const maxTokens = config.maxTokens || 2048
  const temperature = config.temperature ?? 0.7
  const model = config.model || 'deepseek-chat'

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        temperature,
        max_tokens: maxTokens
      }),
      signal: options?.signal
    })

    if (!response.ok) {
      const errBody = await response.text()
      throw new Error(`API Error ${response.status}: ${errBody}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('Response body is not readable')

    const decoder = new TextDecoder()
    let fullContent = ''
    let buffer = ''
    let estimatedInputTokens = 0
    let estimatedOutputTokens = 0

    for (const m of messages) {
      estimatedInputTokens += Math.ceil(m.content.length / 2)
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed = JSON.parse(data)
          const token = parsed.choices?.[0]?.delta?.content || ''
          if (token) {
            fullContent += token
            callbacks.onToken(token)
          }
          if (parsed.usage) {
            estimatedInputTokens = parsed.usage.prompt_tokens || estimatedInputTokens
            estimatedOutputTokens = parsed.usage.completion_tokens || fullContent.length
          }
        } catch {
          // skip unparseable chunks
        }
      }
    }

    estimatedOutputTokens = Math.max(estimatedOutputTokens, Math.ceil(fullContent.length / 2))

    const cost = calculateCost(estimatedInputTokens, estimatedOutputTokens)
    const now = new Date().toISOString()
    const record: UsageRecord = {
      id: now,
      timestamp: Date.now(),
      inputTokens: estimatedInputTokens,
      outputTokens: estimatedOutputTokens,
      totalTokens: estimatedInputTokens + estimatedOutputTokens,
      cost,
      model
    }
    addUsageRecord(record)

    checkBudgetAndDisable()

    callbacks.onDone(fullContent)
  } catch (err: any) {
    if (err.name === 'AbortError') return
    callbacks.onError(err)
  }
}

export async function chat(
  messages: DeepSeekMessage[],
  options?: { signal?: AbortSignal; config?: DeepSeekConfig }
): Promise<string> {
  return new Promise((resolve, reject) => {
    let content = ''
    streamChat(messages, {
      onToken: (token) => { content += token },
      onDone: () => resolve(content),
      onError: reject
    }, options)
  })
}
