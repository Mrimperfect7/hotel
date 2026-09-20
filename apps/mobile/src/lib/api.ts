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

async function request<T>(path: string, init: RequestInit & { auth?: boolean } = {}): Promise<T> {
  const { auth, ...rest } = init;
  const token = auth ? await getToken() : null;
  const res = await fetch(`${API}${path}`, {
    ...rest,
    headers: {
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
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
};
