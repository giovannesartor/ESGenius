"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { authApi, ApiError } from "@/services/api";

interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_email_verified: boolean;
  is_superadmin?: boolean;
  is_active?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshingRef = useRef(false);

  const clearAuth = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setUser(null);
    setToken(null);
  }, []);

  const tryRefreshToken = useCallback(async (): Promise<string | null> => {
    if (refreshingRef.current) return null;
    refreshingRef.current = true;
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return null;
      const response = await authApi.refresh(refreshToken);
      localStorage.setItem("access_token", response.access_token);
      localStorage.setItem("refresh_token", response.refresh_token);
      return response.access_token;
    } catch {
      clearAuth();
      return null;
    } finally {
      refreshingRef.current = false;
    }
  }, [clearAuth]);

  const loadUser = useCallback(async (accessToken: string) => {
    try {
      const userData = await authApi.getMe(accessToken) as User;
      setUser(userData);
      setToken(accessToken);
    } catch (err) {
      // If 401, try refreshing the token
      if (err instanceof ApiError && err.status === 401) {
        const newToken = await tryRefreshToken();
        if (newToken) {
          try {
            const userData = await authApi.getMe(newToken) as User;
            setUser(userData);
            setToken(newToken);
            return;
          } catch {
            // refresh also failed
          }
        }
      }
      clearAuth();
    }
  }, [clearAuth, tryRefreshToken]);

  useEffect(() => {
    const savedToken = localStorage.getItem("access_token");
    if (savedToken) {
      loadUser(savedToken).finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem("access_token", response.access_token);
    localStorage.setItem("refresh_token", response.refresh_token);
    await loadUser(response.access_token);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authApi.register({ email, password, full_name: fullName });
  };

  const logout = () => {
    clearAuth();
  };

  const googleLogin = async () => {
    const data = await authApi.googleLogin();
    window.location.href = data.authorization_url;
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, register, logout, googleLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
