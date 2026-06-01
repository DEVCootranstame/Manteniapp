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

    const data = await response.json();
    
    // Validate token response
    if (!data.access_token || !data.refresh_token || !data.expires_in) {
      throw new Error('Respuesta inválida del servidor: tokens ausentes o expiración no especificada');
    }

    // Pass to storage service, it will calculate expires_at
    await StorageService.setTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });

    // Fetch profile
    const profile = await ApiService.get<UserProfile>('/auth/profile');
    
    // Validate profile
    if (!profile.id || !profile.name || !profile.email) {
      throw new Error('Respuesta inválida del servidor: perfil incompleto');
    }
    
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
