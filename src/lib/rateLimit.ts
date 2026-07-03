type Bucket = { count: number; resetAt: number };

export class MemoryRateLimiter {
  private buckets = new Map<string, Bucket>();

  check(key: string, limit: number, windowMs: number, now = Date.now()) {
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      const bucket = { count: 1, resetAt: now + windowMs };
      this.buckets.set(key, bucket);
      return { allowed: true, remaining: limit - 1, resetAt: bucket.resetAt };
    }

    if (current.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: current.resetAt };
    }

    current.count += 1;
    return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
  }

  reset() {
    this.buckets.clear();
  }
}

export const resolveRateLimiter = new MemoryRateLimiter();

