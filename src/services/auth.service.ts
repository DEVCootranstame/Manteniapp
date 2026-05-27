import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { AuthTokens, LoginCredentials, UserProfile, UserRole } from '../types/auth.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

/** Normaliza el rol del backend al enum interno */
function normalizeRole(raw: string): UserRole {
  const lower = raw.toLowerCase();
  if (lower === 'administrador') return 'admin';
  return lower as UserRole;
}

export const AuthService = {
  async login(credentials: LoginCredentials): Promise<UserProfile> {
    // Login request (no auth needed)
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Credenciales inválidas');
    }

    const tokens: AuthTokens = await response.json();
    await StorageService.setTokens(tokens);

    // Fetch profile
    const profile = await ApiService.get<UserProfile>('/auth/profile');
    profile.role = normalizeRole(profile.role);
    await StorageService.setProfile(profile);
    return profile;
  },

  async getProfile(): Promise<UserProfile> {
    const profile = await ApiService.get<UserProfile>('/auth/profile');
    profile.role = normalizeRole(profile.role);
    return profile;
  },

  async logout(refreshToken: string): Promise<void> {
    try {
      await ApiService.post('/auth/logout', { refresh_token: refreshToken });
    } catch {
      // Best effort logout
    }
    await StorageService.clearAll();
  },

  async getStoredProfile(): Promise<UserProfile | null> {
    const profile = await StorageService.getProfile<UserProfile>();
    if (profile) {
      profile.role = normalizeRole(profile.role);
    }
    return profile;
  },

  async isAuthenticated(): Promise<boolean> {
    const tokens = await StorageService.getTokens();
    return !!tokens;
  },
};
