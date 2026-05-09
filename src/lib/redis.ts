// src/lib/redis.ts
// Redis client singleton with graceful fallback — if REDIS_URL is unset,
// all cache helpers pass through directly to the DB function.

import Redis from 'ioredis';

let redis: Redis | null = null;

if (process.env.REDIS_URL) {
  // Coolify generates URLs like redis://servicename:password@host:port/db.
  // Standard Redis uses password-only auth — strip any non-default username so
  // ioredis sends AUTH <password> rather than AUTH <username> <password>.
  const rawUrl = new URL(process.env.REDIS_URL);
  const options = {
    host:     rawUrl.hostname,
    port:     parseInt(rawUrl.port || '6379', 10),
    password: rawUrl.password ? decodeURIComponent(rawUrl.password) : undefined,
    db:       parseInt(rawUrl.pathname.slice(1) || '0', 10),
    maxRetriesPerRequest: 2,
    connectTimeout: 5_000,
  };

  redis = new Redis(options);

  redis.on('error', (err: Error) => {
    console.error('[Redis] connection error:', err.message);
  });
}

export { redis };

/**
 * Try to return the cached value for `key`. On miss, call `fn`, cache the
 * result for `ttlSeconds`, and return it. Falls back to `fn` if Redis is
 * unavailable or throws.
 *
 * NOTE: Date objects are serialised to ISO strings. Consuming code that needs
 * real Date instances should call `new Date(value)` on those fields.
 */
export async function getOrSet<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number,
): Promise<T> {
  if (!redis) return fn();

  try {
    const cached = await redis.get(key);
    if (cached !== null) return JSON.parse(cached) as T;

    const result = await fn();
    await redis.setex(key, ttlSeconds, JSON.stringify(result));
    return result;
  } catch (err) {
    console.error(`[Redis] getOrSet error for key "${key}":`, err);
    return fn();
  }
}

/** Delete one or more exact cache keys. */
export async function invalidate(...keys: string[]): Promise<void> {
  if (!redis || keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch (err) {
    console.error('[Redis] invalidate error:', err);
  }
}

/**
 * Delete all keys matching a glob pattern (e.g. `streamer:*`).
 * Uses SCAN to avoid blocking Redis on large key sets.
 */
export async function invalidatePattern(pattern: string): Promise<void> {
  if (!redis) return;
  try {
    const keys: string[] = [];
    let cursor = '0';
    do {
      const [next, batch] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = next;
      keys.push(...batch);
    } while (cursor !== '0');

    if (keys.length > 0) await redis.del(...keys);
  } catch (err) {
    console.error(`[Redis] invalidatePattern error for "${pattern}":`, err);
  }
}
