import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { authApi } from '@/services/api';
import { AUTH_LOGOUT_EVENT, normalizeError, tokenStore } from '@/services/http';
import { queryClient } from '@/services/queryClient';
import { TOKEN_KEYS } from '@/constants';
import type { Role, User } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  hasRole: (...roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEYS.user);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(readStoredUser);
  const [isInitializing, setIsInitializing] = useState(true);

  // On boot, if we have a token, verify it and refresh the user profile.
  useEffect(() => {
    let active = true;
    (async () => {
      if (!tokenStore.access) {
        setIsInitializing(false);
        return;
      }
      try {
        const me = await authApi.me();
        if (!active) return;
        setUser(me);
        localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(me));
      } catch {
        tokenStore.clear();
        if (active) setUser(null);
      } finally {
        if (active) setIsInitializing(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // React to forced logouts triggered by the http layer (failed refresh).
  useEffect(() => {
    const handler = () => {
      setUser(null);
      queryClient.clear();
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handler);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      tokenStore.set(result.accessToken, result.refreshToken);
      localStorage.setItem(TOKEN_KEYS.user, JSON.stringify(result.user));
      setUser(result.user);
      return result.user;
    } catch (error) {
      throw normalizeError(error);
    }
  }, []);

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh;
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // best-effort — clear locally regardless
    }
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
  }, []);

  const hasRole = useCallback(
    (...roles: Role[]) => (user ? roles.includes(user.role) : false),
    [user]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isInitializing, login, logout, hasRole }),
    [user, isInitializing, login, logout, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
