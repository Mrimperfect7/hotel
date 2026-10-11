/**
 * Typed API client for the web app. All requests go to the Express API
 * (API_ORIGIN); bearer token stored in memory + localStorage (XS-less API).
 */
'use client';

export const API =
  process.env.NEXT_PUBLIC_API_ORIGIN ?? 'http://localhost:4000';

const TOKEN_KEY = 'gsv_access';
const REFRESH_KEY = 'gsv_refresh';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setTokens(access: string, refresh?: string) {
  window.localStorage.setItem(TOKEN_KEY, access);
  if (refresh) window.localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearTokens() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_KEY);
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = window.localStorage.getItem(REFRESH_KEY);
  if (!refreshToken) return false;
  const res = await fetch(`${API}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) return false;
  const data = (await res.json()) as { accessToken: string; refreshToken: string };
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

export type TokenUser = {
  id: string;
  role: string;
  name: string;
  email: string;
  phone?: string;
  exp?: number;
};

export function getUserFromToken(): TokenUser | null {
  const token = getToken();
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    if (parsed.exp && parsed.exp * 1000 < Date.now()) {
      return null;
    }
    return parsed as TokenUser;
  } catch {
    return null;
  }
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// In-flight request deduplication & memory cache
const inFlightRequests = new Map<string, Promise<any>>();
const memoryCache = new Map<string, { data: any; expiry: number }>();

export function invalidateApiCache(prefix?: string) {
  if (!prefix) {
    memoryCache.clear();
  } else {
    for (const key of memoryCache.keys()) {
      if (key.includes(prefix)) memoryCache.delete(key);
    }
  }
}

async function request<T>(
  path: string,
  init: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth, ...rest } = init;
  const doFetch = () =>
    fetch(`${API}${path}`, {
      ...rest,
      headers: {
        ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
        ...(auth && getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        ...rest.headers,
      },
    });

  let res = await doFetch();
  // Single silent refresh-and-retry on 401.
  if (res.status === 401 && auth) {
    const ok = await refreshAccessToken();
    if (ok) res = await doFetch();
    else clearTokens();
  }

  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      (body.error as string) ?? 'INTERNAL',
      (body.message as string) ?? 'Something went wrong. Please try again.'
    );
  }
  return body as T;
}

export const api = {
  get: <T>(
    path: string,
    auth = false,
    options?: { cacheTtlMs?: number; skipCache?: boolean }
  ): Promise<T> => {
    const ttl =
      options?.cacheTtlMs ??
      (path.includes('/dashboard') || path.includes('/stats') || path.includes('/me')
        ? 15000
        : 0);
    const cacheKey = `${auth ? 'auth:' : 'pub:'}${path}`;

    if (!options?.skipCache && ttl > 0) {
      const cached = memoryCache.get(cacheKey);
      if (cached && cached.expiry > Date.now()) {
        return Promise.resolve(cached.data as T);
      }
    }

    // Deduplicate identical concurrent in-flight requests
    if (inFlightRequests.has(cacheKey)) {
      return inFlightRequests.get(cacheKey)! as Promise<T>;
    }

    const promise = request<T>(path, { method: 'GET', auth })
      .then((data) => {
        if (ttl > 0) {
          memoryCache.set(cacheKey, { data, expiry: Date.now() + ttl });
        }
        return data;
      })
      .finally(() => {
        inFlightRequests.delete(cacheKey);
      });

    inFlightRequests.set(cacheKey, promise);
    return promise;
  },
  post: <T>(path: string, body?: unknown, auth = false) => {
    invalidateApiCache();
    return request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, auth });
  },
  patch: <T>(path: string, body?: unknown, auth = false) => {
    invalidateApiCache();
    return request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, auth });
  },
  del: <T>(path: string, auth = false) => {
    invalidateApiCache();
    return request<T>(path, { method: 'DELETE', auth });
  },
  delete: <T>(path: string, auth = false) => {
    invalidateApiCache();
    return request<T>(path, { method: 'DELETE', auth });
  },
};
