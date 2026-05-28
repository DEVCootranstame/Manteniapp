import { Preferences } from '@capacitor/preferences';

const TOKEN_KEY = 'auth_tokens';
const PROFILE_KEY = 'user_profile';
const LAST_ACTIVITY_KEY = 'last_activity_ts';

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

export const StorageService = {
  async setTokens(tokens: { access_token: string; refresh_token: string; expires_in: number }) {
    const stored: StoredTokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: Date.now() + tokens.expires_in * 1000,
    };
    await Preferences.set({ key: TOKEN_KEY, value: JSON.stringify(stored) });
  },

  async getTokens(): Promise<StoredTokens | null> {
    const { value } = await Preferences.get({ key: TOKEN_KEY });
    return value ? JSON.parse(value) : null;
  },

  async clearTokens() {
    await Preferences.remove({ key: TOKEN_KEY });
  },

  async setProfile(profile: unknown) {
    await Preferences.set({ key: PROFILE_KEY, value: JSON.stringify(profile) });
  },

  async getProfile<T>(): Promise<T | null> {
    const { value } = await Preferences.get({ key: PROFILE_KEY });
    return value ? JSON.parse(value) : null;
  },

  async clearProfile() {
    await Preferences.remove({ key: PROFILE_KEY });
  },

  async clearAll() {
    await Preferences.remove({ key: TOKEN_KEY });
    await Preferences.remove({ key: PROFILE_KEY });
    await Preferences.remove({ key: LAST_ACTIVITY_KEY });
  },

  async touchActivity() {
    await Preferences.set({ key: LAST_ACTIVITY_KEY, value: Date.now().toString() });
  },

  async isSessionExpiredByInactivity(): Promise<boolean> {
    const { value } = await Preferences.get({ key: LAST_ACTIVITY_KEY });
    if (!value) return true; // No activity recorded = expired
    const lastActivity = parseInt(value, 10);
    return (Date.now() - lastActivity) > SESSION_MAX_AGE_MS;
  },
};
