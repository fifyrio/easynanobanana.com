class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const userRequests = this.requests.get(identifier)!;
    
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    if (validRequests.length >= this.maxRequests) {
      return false;
    }
    
    validRequests.push(now);
    this.requests.set(identifier, validRequests);
    
    return true;
  }

  getTimeUntilReset(identifier: string): number {
    const userRequests = this.requests.get(identifier);
    if (!userRequests || userRequests.length === 0) {
      return 0;
    }
    
    const oldestRequest = Math.min(...userRequests);
    const resetTime = oldestRequest + this.windowMs;
    
    return Math.max(0, resetTime - Date.now());
  }

  getRemainingRequests(identifier: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    const userRequests = this.requests.get(identifier) || [];
    const validRequests = userRequests.filter(timestamp => timestamp > windowStart);
    
    return Math.max(0, this.maxRequests - validRequests.length);
  }
}

const imageLimiter = new RateLimiter(60000, 5); // 5 requests per minute for image generation

export { RateLimiter, imageLimiter };