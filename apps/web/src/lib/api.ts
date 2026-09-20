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

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
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
  get: <T>(path: string, auth = false) => request<T>(path, { method: 'GET', auth }),
  post: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined, auth }),
  patch: <T>(path: string, body?: unknown, auth = false) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined, auth }),
  del: <T>(path: string, auth = false) => request<T>(path, { method: 'DELETE', auth }),
  delete: <T>(path: string, auth = false) => request<T>(path, { method: 'DELETE', auth }),
};
