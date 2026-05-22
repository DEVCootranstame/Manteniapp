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
          setUser(profile);
          // Refresh profile in background — if it fails, clear session
          AuthService.getProfile()
            .then((fresh) => {
              setUser(fresh);
              StorageService.setProfile(fresh);
            })
            .catch(async () => {
              // Token invalid or API unreachable — keep stored profile
              // Only clear if we get an auth error (handled by session-expired event)
            });
        } else {
          // Stored profile is incomplete, clear it
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
    setUser(profile);
  }, []);

  const logout = useCallback(async () => {
    const tokens = await StorageService.getTokens();
    if (tokens) {
      await AuthService.logout(tokens.refresh_token);
    }
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
