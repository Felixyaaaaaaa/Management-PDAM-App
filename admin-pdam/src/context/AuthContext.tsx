import { createContext, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";

interface User {
  id: number;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

type JwtPayload = {
  exp?: number;
};

const TOKEN_KEY = "token";
const USER_KEY = "user";

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const parseJwtPayload = (token: string): JwtPayload | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decoded = atob(padded);

    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
};

const getTokenExpiryMs = (token: string): number | null => {
  const payload = parseJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
};

const getInitialUser = (): User | null => {
  const token = localStorage.getItem(TOKEN_KEY);
  const storedUser = localStorage.getItem(USER_KEY);

  if (!token || !storedUser) {
    clearStoredAuth();
    return null;
  }

  const tokenExpiryMs = getTokenExpiryMs(token);
  if (!tokenExpiryMs || tokenExpiryMs <= Date.now()) {
    clearStoredAuth();
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    clearStoredAuth();
    return null;
  }
};

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getInitialUser());

  const logout = useCallback(() => {
    clearStoredAuth();
    setUser(null);
  }, []);

  const login = useCallback((token: string, userData: User) => {
    const tokenExpiryMs = getTokenExpiryMs(token);

    if (!tokenExpiryMs || tokenExpiryMs <= Date.now()) {
      clearStoredAuth();
      setUser(null);
      return;
    }

    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      logout();
      return;
    }

    const tokenExpiryMs = getTokenExpiryMs(token);
    if (!tokenExpiryMs) {
      logout();
      return;
    }

    const timeoutMs = tokenExpiryMs - Date.now();
    if (timeoutMs <= 0) {
      logout();
      return;
    }

    const timer = window.setTimeout(() => {
      logout();
    }, timeoutMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
