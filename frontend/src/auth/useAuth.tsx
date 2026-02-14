import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { authApi } from '../api/client';

type User = { userId: number; username: string; displayName: string; role: { name: string } };

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<{
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}>(null!);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState<User | null>(() => (localStorage.getItem(TOKEN_KEY) ? getStoredUser() : null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    setLoading(false);
    authApi.profile().then((p) => setUser(p as User)).catch(() => {
      // Don't clear token on profile failure – keep user from localStorage so we stay on the app
    });
  }, [token]);

  const login = useCallback(async (username: string, password: string) => {
    const { access_token, user: u } = await authApi.login(username, password);
    const userData = u as User;
    localStorage.setItem(TOKEN_KEY, access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    flushSync(() => {
      setToken(access_token);
      setUser(userData);
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
