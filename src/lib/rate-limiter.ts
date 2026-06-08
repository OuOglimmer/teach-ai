export class RateLimiter {
  private windowMs: number
  private maxRequests: number
  private requests: number[] = []

  constructor(maxRequests: number = 30, windowMs: number = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  tryAcquire(): boolean {
    const now = Date.now()
    const windowStart = now - this.windowMs
    this.requests = this.requests.filter(t => t > windowStart)

    if (this.requests.length >= this.maxRequests) {
      return false
    }

    this.requests.push(now)
    return true
  }

  get remainingRequests(): number {
    const now = Date.now()
    const windowStart = now - this.windowMs
    this.requests = this.requests.filter(t => t > windowStart)
    return Math.max(0, this.maxRequests - this.requests.length)
  }

  get resetTime(): number {
    if (this.requests.length === 0) return 0
    const oldest = this.requests[0]
    return oldest + this.windowMs
  }

  reset() {
    this.requests = []
  }
}

export const globalRateLimiter = new RateLimiter(30, 60000)
