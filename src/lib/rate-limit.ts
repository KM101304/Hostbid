type RateLimitConfig = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

type Entry = {
  count: number;
  resetAt: number;
};

const store = new Map<string, Entry>();

function now() {
  return Date.now();
}

function cleanup(timestamp: number) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= timestamp) {
      store.delete(key);
    }
  }
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitConfig): RateLimitResult {
  const timestamp = now();
  cleanup(timestamp);

  const existing = store.get(key);

  if (!existing || existing.resetAt <= timestamp) {
    const resetAt = timestamp + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetAt,
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    limit,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}
