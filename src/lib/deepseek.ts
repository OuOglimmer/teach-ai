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
const RUNTIME_KEY_STORAGE = 'deepseek_runtime_api_key'

export type ApiKeySource = 'runtime' | 'vault' | 'env' | 'none'

let cachedKey: string | null = null
let cachedKeySource: ApiKeySource | null = null

function getRuntimeApiKey(): string {
  try {
    return sessionStorage.getItem(RUNTIME_KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setRuntimeApiKey(key: string) {
  const trimmed = key.trim()
  if (!trimmed) return
  try {
    sessionStorage.setItem(RUNTIME_KEY_STORAGE, trimmed)
  } catch {
    // sessionStorage may be unavailable in restricted contexts.
  }
  cachedKey = trimmed
  cachedKeySource = 'runtime'
}

export function clearRuntimeApiKey() {
  try {
    sessionStorage.removeItem(RUNTIME_KEY_STORAGE)
  } catch {
    // ignore storage failures
  }
  if (cachedKeySource === 'runtime') {
    cachedKey = null
    cachedKeySource = null
  }
}

async function getApiKey(): Promise<string> {
  if (cachedKey) return cachedKey

  const fromRuntime = getRuntimeApiKey()
  if (fromRuntime) {
    cachedKey = fromRuntime
    cachedKeySource = 'runtime'
    return fromRuntime
  }

  const fromVault = await api.getDeepseekApiKey()
  if (fromVault) {
    cachedKey = fromVault
    cachedKeySource = 'vault'
    return fromVault
  }

  const fromEnv = import.meta.env.VITE_DEEPSEEK_API_KEY || ''
  if (fromEnv) {
    cachedKey = fromEnv
    cachedKeySource = 'env'
    return fromEnv
  }

  cachedKeySource = 'none'
  return ''
}

export async function getApiKeySource(): Promise<ApiKeySource> {
  await getApiKey()
  return cachedKeySource || 'none'
}

export async function isMockMode(): Promise<boolean> {
  return (await getApiKeySource()) === 'none'
}

export async function hasApiKey(): Promise<boolean> {
  return (await getApiKeySource()) !== 'none'
}

export function clearKeyCache() {
  cachedKey = null
  cachedKeySource = null
}

const mockResponses: Record<string, string> = {
  default: '这是一个很好的问题！让我来为你详细解答。\n\n首先，我们需要理解这个问题的核心概念。\n\n1. **基本原理**：这是解决问题的基础，掌握了原理才能灵活运用\n2. **解题步骤**：按照规范的步骤逐步推导\n3. **常见误区**：注意避免容易出错的地方\n\n如果还有疑问，欢迎继续提问！',
  '二次函数': '对于二次函数 $f(x)=ax^2+bx+c$（$a\\neq0$）：\n\n### 最值求解\n当 $a>0$ 时，抛物线开口向上，顶点处取**最小值**；\n当 $a<0$ 时，抛物线开口向下，顶点处取**最大值**。\n\n### 顶点公式\n顶点坐标为：\n$$\\left(-\\frac{b}{2a},\\ \\frac{4ac-b^2}{4a}\\right)$$\n\n### 示例\n求 $f(x)=2x^2-8x+3$ 的最小值：\n- $a=2>0$，开口向上，有最小值\n- 顶点横坐标：$x=-\\frac{-8}{2\\times2}=2$\n- 最小值：$f(2)=2\\times4-16+3=-5$\n\n你可以在图像上验证这个结果。',
  '牛顿': '### 牛顿第一定律（惯性定律）\n\n> 一切物体在没有受到力的作用时，总保持静止状态或匀速直线运动状态。\n\n#### 核心要点\n1. **惯性**：物体保持原来运动状态的性质\n2. **力不是维持运动的原因**，而是改变运动状态的原因\n3. **理想实验**：伽利略的理想斜面实验为这一定律奠定了基础\n\n#### 生活实例\n- 刹车时人往前倾倒（身体保持原来的运动状态）\n- 拍打衣服可以除去灰尘（灰尘由于惯性脱离衣服）\n\n#### 易错提醒\n物体不受力时，**不一定静止**，也可能做匀速直线运动。惯性大小只与质量有关，与速度无关。',
  '现在完成时': '### 现在完成时 vs 一般过去时\n\n| 对比项 | 现在完成时 | 一般过去时 |\n|--------|-----------|-----------|\n| **结构** | have/has + 过去分词 | 动词过去式 |\n| **侧重点** | 强调**过去对现在的影响** | 强调**过去的动作** |\n| **时间状语** | already, yet, ever, never, since, for | yesterday, last week, ago |\n\n#### 例句对比\n- **现在完成时**：I **have lost** my key.（钥匙现在还没找到）\n- **一般过去时**：I **lost** my key yesterday.（只是说昨天丢了，现在可能已经找到）\n\n#### 判断口诀\n> 过去发生已结束，确定时间用过去；\n> 过去发生到现在，影响持续用完成。',
  '勾股定理': '### 勾股定理\n\n> 在直角三角形中，两条直角边的平方和等于斜边的平方。\n> $$a^2 + b^2 = c^2$$\n\n#### 证明方法（面积法）\n\n1. 构造一个边长为 $a+b$ 的大正方形\n2. 内部放入四个全等的直角三角形（直角边为 a、b，斜边为 c）\n3. 中间留出一个边长为 c 的小正方形\n4. 大正方形面积 = $(a+b)^2 = a^2 + 2ab + b^2$\n5. 四个三角形面积 = $4 \\times \\frac{ab}{2} = 2ab$\n6. 小正方形面积 = $c^2$\n7. 所以 $a^2 + 2ab + b^2 = 2ab + c^2$，即 $a^2 + b^2 = c^2$\n\n#### 应用场景\n- 求直角三角形的未知边长\n- 判断三角形是否为直角三角形\n- 在坐标系中求两点间距离',
  '英语作文': '### 关于环保的英语作文\n\n**题目**：How to Protect the Environment\n\n**范文**：\n\n---\n\n**How to Protect the Environment**\n\nNowadays, environmental protection has become one of the most important issues in our daily lives. As students, we can do many things to help protect our planet.\n\n**Firstly**, we should reduce waste by using fewer plastic products. For example, we can bring our own shopping bags instead of using plastic bags.\n\n**Secondly**, we can save energy by turning off lights and electronic devices when we are not using them. Taking public transportation instead of private cars is also a good way to reduce carbon emissions.\n\n**Thirdly**, recycling is another effective way to protect the environment. We should sort our garbage and recycle paper, glass, and plastic.\n\n**In conclusion**, every small action counts. If everyone does their part, we can make our world a cleaner and better place to live.\n\n---\n\n**关键词汇**：environmental protection（环保）、reduce waste（减少浪费）、recycle（回收）、carbon emissions（碳排放）',
  '一元二次': '### 求解 $x^2 - 5x + 6 = 0$\n\n#### 方法一：因式分解法（推荐）\n\n寻找两个数，和为 $-5$，积为 $6$：\n- $(-2) + (-3) = -5$\n- $(-2) \\times (-3) = 6$\n\n所以：\n$$(x-2)(x-3) = 0$$\n\n解得：\n$$x_1 = 2,\\quad x_2 = 3$$\n\n#### 方法二：求根公式\n$$x = \\frac{5 \\pm \\sqrt{25-24}}{2} = \\frac{5 \\pm 1}{2}$$\n$$x_1 = 3,\\quad x_2 = 2$$\n\n#### 验证\n- 当 $x=2$：$4 - 10 + 6 = 0$ ✓\n- 当 $x=3$：$9 - 15 + 6 = 0$ ✓\n\n你掌握了吗？可以试试类似的题目：$x^2 - 7x + 12 = 0$',
}

function findMockResponse(userMessage: string): string {
  const lower = userMessage.toLowerCase()
  if (lower.includes('二次函数') || lower.includes('最值') || lower.includes('抛物线')) return mockResponses['二次函数']
  if (lower.includes('牛顿') || lower.includes('惯性') || lower.includes('物理')) return mockResponses['牛顿']
  if (lower.includes('现在完成时') || lower.includes('过去式') || lower.includes('时态')) return mockResponses['现在完成时']
  if (lower.includes('勾股') || lower.includes('勾股定理') || lower.includes('直角三角形')) return mockResponses['勾股定理']
  if (lower.includes('英语作文') || lower.includes('环保') || lower.includes('environment')) return mockResponses['英语作文']
  if (lower.includes('一元二次') || lower.includes('方程') || lower.includes('x²') || lower.includes('x^2')) return mockResponses['一元二次']
  return mockResponses.default
}

async function mockStreamChat(
  messages: DeepSeekMessage[],
  callbacks: StreamCallbacks,
  signal?: AbortSignal
) {
  const userMsg = [...messages].reverse().find(m => m.role === 'user')
  const fullContent = findMockResponse(userMsg?.content || '')

  for (let i = 0; i < fullContent.length; i++) {
    if (signal?.aborted) return
    callbacks.onToken(fullContent[i])
    const delay = fullContent[i] === '\n' ? 80 : fullContent[i] === ' ' ? 20 : 30
    await new Promise(r => setTimeout(r, delay))
  }

  if (!signal?.aborted) {
    callbacks.onDone(fullContent)
  }
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
    await mockStreamChat(messages, callbacks, options?.signal)
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

    let streamDone = false

    const processSseLine = (line: string) => {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) return
      const data = trimmed.slice(6)
      if (data === '[DONE]') {
        streamDone = true
        return
      }

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
      } catch (error) {
        console.warn('Failed to parse DeepSeek stream chunk:', error)
      }
    }

    while (!streamDone) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        processSseLine(line)
        if (streamDone) break
      }
    }

    if (buffer.trim() && !streamDone) {
      processSseLine(buffer)
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
