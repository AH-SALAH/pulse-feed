export class TokenBucket {
  private buckets = new Map<string, { tokens: number; last: number }>();

  constructor(
    readonly capacity: number,
    private readonly refillPerWindow: number,
    private readonly windowMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  allow(key: string): boolean {
    const now = this.now();
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: this.capacity, last: now };
      this.buckets.set(key, bucket);
    }

    const elapsed = now - bucket.last;
    const refilled =
      Math.floor(elapsed / this.windowMs) * this.refillPerWindow;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + refilled);
    bucket.last = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return true;
    }
    return false;
  }

  reset(): void {
    this.buckets.clear();
  }
}