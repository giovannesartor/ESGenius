"use client";

/**
 * AuthContext — token-in-memory strategy.
 *
 * Tokens are NEVER stored in localStorage or sessionStorage (XSS risk).
 * Instead:
 *   • The backend sets httpOnly cookies on login/refresh/OAuth.
 *   • The access_token is also returned in the JSON response and kept in
 *     React state (memory only) for the lifetime of the tab.
 *   • On page reload, GET /auth/session exchanges the httpOnly refresh_token
 *     cookie for a fresh access_token without exposing it to JS.
 */

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
  logout: () => Promise<void>;
  googleLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const refreshingRef = useRef(false);

  /** Clear in-memory auth state (cookies are cleared by backend on /logout). */
  const clearAuth = useCallback(() => {
    setUser(null);
    setToken(null);
  }, []);

  /** Load user profile using an access token already in memory. */
  const loadUser = useCallback(
    async (accessToken: string): Promise<boolean> => {
      try {
        const userData = (await authApi.getMe(accessToken)) as User;
        setUser(userData);
        setToken(accessToken);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  /**
   * Restore session from the httpOnly refresh_token cookie.
   * Called once on mount when there is no in-memory token.
   * The cookie is sent automatically (credentials: "include").
   */
  const tryRestoreFromCookie = useCallback(async (): Promise<boolean> => {
    if (refreshingRef.current) return false;
    refreshingRef.current = true;
    try {
      const response = await authApi.restoreSession();
      if (response && response.access_token) {
        return await loadUser(response.access_token);
      }
      return false;
    } catch {
      return false;
    } finally {
      refreshingRef.current = false;
    }
  }, [loadUser]);

  /** On mount: attempt to restore session from cookie. */
  useEffect(() => {
    tryRestoreFromCookie().finally(() => setIsLoading(false));
  }, [tryRestoreFromCookie]);

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    // Cookie is set by backend; also store access_token in memory.
    await loadUser(response.access_token);
  };

  const register = async (email: string, password: string, fullName: string) => {
    await authApi.register({ email, password, full_name: fullName });
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Best-effort: clear memory even if the network call fails.
    }
    clearAuth();
  };

  const googleLogin = async () => {
    const data = await authApi.googleLogin();
    window.location.href = (data as { authorization_url: string }).authorization_url;
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, googleLogin }}
    >
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
