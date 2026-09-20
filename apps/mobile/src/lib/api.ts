/**
 * Mobile API client — tokens live in expo-secure-store (Keychain/Keystore),
 * never in AsyncStorage or plain storage.
 */
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const API =
  (Constants.expoConfig?.extra as { apiOrigin?: string } | undefined)?.apiOrigin ??
  'http://localhost:4000';

const TOKEN_KEY = 'gsv_access';
const REFRESH_KEY = 'gsv_refresh';

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function setTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
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

let refreshInFlight: Promise<boolean> | null = null;

/** Exchange the stored refresh token for a fresh pair (single-flight). */
async function refreshAccessToken(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return false;
      const res = await fetch(`${API}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) { await clearTokens(); return false; }
      const body = (await res.json()) as { accessToken?: string; refreshToken?: string };
      if (!body.accessToken) return false;
      await setTokens(body.accessToken, body.refreshToken ?? refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

async function request<T>(path: string, init: RequestInit & { auth?: boolean; retry?: boolean } = {}): Promise<T> {
  const { auth, retry = true, ...rest } = init;
  const token = auth ? await getToken() : null;
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  // Access token expired → refresh once and replay the request.
  if (res.status === 401 && auth && retry && (await refreshAccessToken())) {
    return request<T>(path, { ...init, retry: false });
  }
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    throw new ApiError(res.status, (body.error as string) ?? 'INTERNAL', (body.message as string) ?? 'Something went wrong.');
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
};
