import { StorageService, StoredTokens } from './storage.service';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const DEFAULT_TIMEOUT_MS = 15000; // 15 segundos

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
  timeout?: number;
}

class ApiServiceClass {
  private refreshPromise: Promise<StoredTokens | null> | null = null;

  private async getValidToken(): Promise<string | null> {
    const tokens = await StorageService.getTokens();
    if (!tokens) return null;

    // Token still valid (with 60s buffer)
    if (tokens.expires_at > Date.now() + 60000) {
      return tokens.access_token;
    }

    // Token expired, refresh
    return this.refreshToken(tokens.refresh_token);
  }

  private async refreshToken(refreshToken: string): Promise<string | null> {
    // Prevent concurrent refresh calls
    if (!this.refreshPromise) {
      this.refreshPromise = this.doRefresh(refreshToken);
    }

    try {
      const tokens = await this.refreshPromise;
      return tokens?.access_token || null;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(refreshToken: string): Promise<StoredTokens | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        await StorageService.clearAll();
        window.dispatchEvent(new CustomEvent('auth:session-expired'));
        return null;
      }

      const data = await response.json();
      await StorageService.setTokens(data);
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_at: Date.now() + data.expires_in * 1000,
      };
    } catch {
      await StorageService.clearAll();
      window.dispatchEvent(new CustomEvent('auth:session-expired'));
      return null;
    }
  }

  async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = 'GET', body, headers = {}, skipAuth = false, timeout = DEFAULT_TIMEOUT_MS } = options;

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (!skipAuth) {
      const token = await this.getValidToken();
      if (!token) {
        throw new Error('No valid authentication token');
      }
      requestHeaders['Authorization'] = `Bearer ${token}`;
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
