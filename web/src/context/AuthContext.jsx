import React, {
  createContext, useContext, useState, useEffect, useCallback, useRef,
} from 'react';
import { authApi } from '../api/auth.js';
import { usersApi } from '../api/users.js';
import { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);
const PUBLIC_AUTH_PATHS = new Set(['/login', '/register', '/forgot', '/reset']);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionRevision = useRef(0);

  const fetchUser = useCallback(async (expectedRevision = sessionRevision.current) => {
    try {
      const data = await usersApi.me();
      if (sessionRevision.current === expectedRevision) setUser(data.user);
      return data.user;
    } catch {
      if (sessionRevision.current === expectedRevision) setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (PUBLIC_AUTH_PATHS.has(window.location.pathname)) {
      setLoading(false);
      return;
    }

    const revision = sessionRevision.current;
    authApi.refresh()
      .then(() => {
        if (sessionRevision.current === revision) return fetchUser(revision);
        return null;
      })
      .catch(() => {
        if (sessionRevision.current === revision) setUser(null);
      })
      .finally(() => setLoading(false));
  }, [fetchUser]);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    sessionRevision.current += 1;
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    await authApi.logout();
    sessionRevision.current += 1;
    setUser(null);
    setAccessToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
