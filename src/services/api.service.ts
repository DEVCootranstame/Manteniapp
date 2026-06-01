import { StorageService, StoredTokens } from './storage.service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const API_KEY = '3ba62ce22890b459a6dc70066d76ea669a23023ba4e9c2a898159ef178554a2b';
const DEFAULT_TIMEOUT_MS = 15000; // 15 segundos

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
}

class ApiServiceClass {
  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false, timeout = DEFAULT_TIMEOUT_MS } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (!skipAuth) {
      // Siempre enviar x-api-key
      requestHeaders['x-api-key'] = API_KEY;

      // También enviar Bearer token si hay uno disponible (para /auth/profile, etc.)
      const tokens = await StorageService.getTokens();
      if (tokens?.access_token) {
        requestHeaders['Authorization'] = `Bearer ${tokens.access_token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      if (response.status === 401) {
        await StorageService.clearAll();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado. Verifica tu conexión.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  get<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'POST', body });
  }

  patch<T>(endpoint: string, body: unknown, options?: Omit<ApiOptions, 'method' | 'body'>) {
    return this.request<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  delete<T>(endpoint: string, options?: Omit<ApiOptions, 'method'>) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const ApiService = new ApiServiceClass();
