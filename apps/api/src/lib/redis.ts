import { Redis } from 'ioredis';
import { RedisStore } from 'rate-limit-redis';
import type { Request, Response, NextFunction } from 'express';
import { config } from '@gsv/config';

// In-memory fallback store when Redis URL is not configured or during connection outages
const memoryCache = new Map<string, { data: any; expiresAt: number }>();

function cleanMemoryCache() {
  const now = Date.now();
  for (const [k, v] of memoryCache.entries()) {
    if (v.expiresAt <= now) {
      memoryCache.delete(k);
    }
  }
}
setInterval(cleanMemoryCache, 60_000).unref();

let redisClient: Redis | null = null;
let isRedisConnected = false;

const redisUrl = config.redisUrl || process.env.REDIS_URL;

if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      enableReadyCheck: true,
      connectTimeout: 5000,
      retryStrategy(times) {
        if (times > 10) {
          // eslint-disable-next-line no-console
          console.warn('[Redis] Max connection retries reached. Falling back to in-memory mode.');
          return null; // Stop retrying automatically; fallback to memory
        }
        return Math.min(times * 200, 3000);
      },
    });

    redisClient.on('connect', () => {
      // eslint-disable-next-line no-console
      console.log('[Redis] Connecting to Redis instance…');
    });

    redisClient.on('ready', () => {
      isRedisConnected = true;
      // eslint-disable-next-line no-console
      console.log('⚡ [Redis] Connected and ready for caching & surge protection.');
    });

    redisClient.on('error', (err) => {
      isRedisConnected = false;
      // eslint-disable-next-line no-console
      console.warn('[Redis] Connection warning (running in resilient fallback mode):', err.message);
    });

    redisClient.on('close', () => {
      isRedisConnected = false;
    });
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.warn('[Redis] Failed to initialize Redis client; running with in-memory fallback:', err.message);
    redisClient = null;
  }
} else {
  // eslint-disable-next-line no-console
  console.log('[Redis] REDIS_URL not set; using resilient in-memory caching and rate limiting.');
}

export { redisClient, isRedisConnected };

/**
 * Retrieve cached JSON value by key.
 */
export async function getCache<T = any>(key: string): Promise<T | null> {
  if (redisClient && isRedisConnected) {
    try {
      const raw = await redisClient.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      // Redis read failed, fall through to memory check
    }
  }

  const item = memoryCache.get(key);
  if (item && item.expiresAt > Date.now()) {
    return item.data as T;
  }
  if (item) {
    memoryCache.delete(key);
  }
  return null;
}

/**
 * Store a JSON value in cache with TTL in seconds.
 */
export async function setCache(key: string, value: any, ttlSeconds: number = 60): Promise<void> {
  // Always store in memory fallback
  memoryCache.set(key, { data: value, expiresAt: Date.now() + ttlSeconds * 1000 });

  if (redisClient && isRedisConnected) {
    try {
      await redisClient.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      // Non-fatal if Redis write fails; memory cache is already set
    }
  }
}

/**
 * Invalidate a specific key.
 */
export async function delCache(key: string): Promise<void> {
  memoryCache.delete(key);
  if (redisClient && isRedisConnected) {
    try {
      await redisClient.del(key);
    } catch {
      // Ignored
    }
  }
}

/**
 * Invalidate all keys matching a prefix/pattern.
 */
export async function clearCachePattern(pattern: string): Promise<void> {
  // Clear memory cache matching prefix
  for (const k of memoryCache.keys()) {
    if (k.startsWith(pattern) || (pattern.endsWith('*') && k.startsWith(pattern.slice(0, -1)))) {
      memoryCache.delete(k);
    }
  }

  if (redisClient && isRedisConnected) {
    try {
      const stream = redisClient.scanStream({ match: pattern.includes('*') ? pattern : `${pattern}*`, count: 50 });
      stream.on('data', (keys: string[]) => {
        if (keys.length && redisClient) {
          redisClient.del(...keys);
        }
      });
    } catch {
      // Ignored
    }
  }
}

/**
 * Express middleware to cache GET endpoints and prevent duplicate database loads under high customer traffic.
 */
export function cacheMiddleware(options: {
  ttlSeconds: number;
  prefix?: string;
  keyGenerator?: (req: Request) => string | undefined;
}) {
  const { ttlSeconds, prefix = 'cache:http', keyGenerator } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const customKey = keyGenerator ? keyGenerator(req) : undefined;
    const key = customKey
      ? `${prefix}:${customKey}`
      : `${prefix}:${req.baseUrl}${req.path}?${new URLSearchParams(req.query as Record<string, string>).toString()}`;

    try {
      const cached = await getCache(key);
      if (cached !== null) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('Cache-Control', `public, max-age=${ttlSeconds}`);
        return res.json(cached);
      }
    } catch {
      // Fall through on cache error
    }

    res.setHeader('X-Cache', 'MISS');

    // Intercept res.json to populate cache
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      // Only cache 200 OK responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(key, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

/**
 * Returns a Redis store for express-rate-limit if Redis is connected,
 * otherwise returns undefined so express-rate-limit gracefully uses its memory store.
 */
export function getRateLimitStore(prefix: string = 'rl:') {
  if (redisClient && isRedisConnected) {
    return new RedisStore({
      // @ts-expect-error ioredis sendCommand compatibility
      sendCommand: (...args: string[]) => redisClient.call(args[0], ...args.slice(1)),
      prefix,
    });
  }
  return undefined;
}
