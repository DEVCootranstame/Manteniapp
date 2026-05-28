import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserRole } from '../types/auth.types';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  softLogout: () => void;
  hasRole: (role: UserRole | UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored profile on mount
  useEffect(() => {
    const init = async () => {
      try {
        const profile = await AuthService.getStoredProfile();
        if (profile && profile.name && profile.role) {
          // Strict: if >24h since last activity, force login
          const expired = await StorageService.isSessionExpiredByInactivity();
          if (expired) {
            await StorageService.clearAll();
            setUser(null);
            return;
          }

          // Check if access token is still valid or can be refreshed
          const tokens = await StorageService.getTokens();
          if (!tokens) {
            await StorageService.clearAll();
            setUser(null);
            return;
          }

          // If token expired, try to refresh before granting access
          if (tokens.expires_at <= Date.now()) {
            try {
              const freshProfile = await AuthService.getProfile();
              setUser(freshProfile);
              StorageService.setProfile(freshProfile);
              StorageService.touchActivity();
            } catch {
              await StorageService.clearAll();
              setUser(null);
            }
            return;
          }

          // Token still valid — use stored profile, refresh in background
          setUser(profile);
          StorageService.touchActivity();
          AuthService.getProfile()
            .then((fresh) => {
              setUser(fresh);
              StorageService.setProfile(fresh);
            })
            .catch(() => {});
        } else {
          await StorageService.clearAll();
          setUser(null);
        }
      } catch {
        await StorageService.clearAll();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Listen for session expired events
  useEffect(() => {
    const handler = () => {
      setUser(null);
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const profile = await AuthService.login({ email, password });
    await StorageService.touchActivity();
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    const tokens = await StorageService.getTokens();
    if (tokens) {
      await AuthService.logout(tokens.refresh_token);
    }
    await StorageService.clearAll();
    setUser(null);
  }, []);

  // Soft logout: only clears in-memory state, keeps tokens/profile in storage.
  // Used for inactivity timeout so the user can re-enter without internet.
  const softLogout = useCallback(() => {
    setUser(null);
  }, []);

  const hasRole = useCallback((role: UserRole | UserRole[]) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        softLogout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
