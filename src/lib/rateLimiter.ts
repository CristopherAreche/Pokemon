interface RateLimitState {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const globalStore = globalThis as unknown as {
  __pokemonRateLimitStore?: Map<string, RateLimitState>;
};

const getStore = (): Map<string, RateLimitState> => {
  if (!globalStore.__pokemonRateLimitStore) {
    globalStore.__pokemonRateLimitStore = new Map<string, RateLimitState>();
  }

  return globalStore.__pokemonRateLimitStore;
};

export const consumeRateLimit = (
  bucket: string,
  identifier: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult => {
  const store = getStore();
  const now = Date.now();
  const key = `${bucket}:${identifier}`;
  const current = store.get(key);

  if (!current || now >= current.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(maxRequests - 1, 0),
      retryAfterSeconds: 0,
    };
  }

  if (current.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(Math.ceil((current.resetAt - now) / 1000), 1),
    };
  }

  current.count += 1;
  store.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(maxRequests - current.count, 0),
    retryAfterSeconds: 0,
  };
};

