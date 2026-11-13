import toast from 'react-hot-toast';
import type { ApiResponse } from '../types/api';
import { useAuthStore } from '../stores/authStore';

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

let onUnauthorizedRedirect: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorizedRedirect = handler;
}

function getBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  return raw.replace(/\/+$/, '');
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${getBaseUrl()}${normalizedEndpoint}`;
  const token = useAuthStore.getState().token;

  const headers = new Headers(options.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const isFormData =
    typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (!isFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let parsedBody: ApiResponse<T> | null = null;
  try {
    parsedBody = (await response.json()) as ApiResponse<T>;
  } catch {
    parsedBody = null;
  }

  if (
    response.status === 401 &&
    !normalizedEndpoint.startsWith('/auth/login')
  ) {
    useAuthStore.getState().logout();
    toast.error('Sesi Anda telah berakhir, silakan masuk kembali', {
      id: 'session-expired',
    });
    if (onUnauthorizedRedirect) {
      onUnauthorizedRedirect();
    } else if (
      typeof window !== 'undefined' &&
      window.location.pathname !== '/login'
    ) {
      window.history.pushState(null, '', '/login');
    }
  }

  if (!response.ok || (parsedBody && parsedBody.success === false)) {
    const errorMessage =
      parsedBody?.message || 'Terjadi kesalahan saat menghubungi server';
    throw new ApiError(response.status, errorMessage);
  }

  if (!parsedBody) {
    throw new ApiError(response.status, 'Respons server tidak valid');
  }

  return parsedBody.data;
}

