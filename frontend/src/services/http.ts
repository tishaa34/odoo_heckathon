import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE, TOKEN_KEYS } from '@/constants';
import type { ApiErrorBody, FieldError } from '@/types';

// ─── Token storage ──────────────────────────────────────────────
export const tokenStore = {
  get access() {
    return localStorage.getItem(TOKEN_KEYS.access);
  },
  get refresh() {
    return localStorage.getItem(TOKEN_KEYS.refresh);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(TOKEN_KEYS.access, access);
    localStorage.setItem(TOKEN_KEYS.refresh, refresh);
  },
  clear() {
    localStorage.removeItem(TOKEN_KEYS.access);
    localStorage.removeItem(TOKEN_KEYS.refresh);
    localStorage.removeItem(TOKEN_KEYS.user);
  },
};

// Broadcast forced logout (e.g. refresh failed) so AuthContext can react.
export const AUTH_LOGOUT_EVENT = 'transitops:logout';
function forceLogout() {
  tokenStore.clear();
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 20000,
});

// Attach the bearer token to every request.
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.access;
  if (token) {
    const headers = AxiosHeaders.from(config.headers);
    headers.set('Authorization', `Bearer ${token}`);
    config.headers = headers;
  }
  return config;
});

// ─── Silent refresh on 401 ──────────────────────────────────────
// A single in-flight refresh is shared by all queued requests.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const refreshToken = tokenStore.refresh;
  if (!refreshToken) throw new Error('No refresh token');
  // Bare axios call so we don't recurse through the interceptor.
  const { data } = await axios.post<{ data: { accessToken: string; refreshToken: string } }>(
    `${API_BASE}/auth/refresh`,
    { refreshToken }
  );
  tokenStore.set(data.data.accessToken, data.data.refreshToken);
  return data.data.accessToken;
}

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retried && !isAuthCall && tokenStore.refresh) {
      original._retried = true;
      try {
        refreshPromise = refreshPromise ?? runRefresh();
        const newToken = await refreshPromise;
        refreshPromise = null;
        const headers = AxiosHeaders.from(original.headers);
        headers.set('Authorization', `Bearer ${newToken}`);
        original.headers = headers;
        return http(original);
      } catch {
        refreshPromise = null;
        forceLogout();
      }
    }
    return Promise.reject(error);
  }
);

// ─── Normalized error surface for the UI ────────────────────────
export interface NormalizedError {
  status: number;
  message: string;
  code: string;
  fieldErrors: FieldError[];
}

export function normalizeError(error: unknown): NormalizedError {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return {
      status: error.response?.status ?? 0,
      message: body?.message ?? (error.code === 'ECONNABORTED' ? 'Request timed out.' : 'Network error. Is the API running?'),
      code: body?.code ?? 'NETWORK_ERROR',
      fieldErrors: body?.errors ?? [],
    };
  }
  return { status: 0, message: (error as Error)?.message ?? 'Unexpected error.', code: 'UNKNOWN', fieldErrors: [] };
}
