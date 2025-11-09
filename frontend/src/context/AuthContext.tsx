"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

type UserRole = "candidate" | "employer" | "admin";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  candidate_profile?: any;
  employer?: any;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string | null) => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "prolinked_token";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Token aus localStorage beim Start laden
  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
    if (storedToken) {
      setTokenState(storedToken);
    }
    setLoading(false);
  }, []);

  // Wenn Token sich ändert → /auth/me neu laden
  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    (async () => {
      try {
        const me = await apiFetch<User>("/auth/me", {}, token);
        setUser(me);
      } catch (err) {
        console.error("Failed to fetch /auth/me", err);
        setUser(null);
        setTokenState(null);
        if (typeof window !== "undefined") {
          localStorage.removeItem(TOKEN_KEY);
        }
      }
    })();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await apiFetch<{ user: User; token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    setTokenState(res.token);
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, res.token);
    }
    setUser(res.user);
  };

  const logout = () => {
    setUser(null);
    setTokenState(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
    // Optional: Logout-Request ans Backend schicken
  };

  const setToken = (newToken: string | null) => {
    setTokenState(newToken);
    if (typeof window !== "undefined") {
      if (newToken) {
        localStorage.setItem(TOKEN_KEY, newToken);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  };

  const refreshMe = async () => {
    if (!token) return;
    const me = await apiFetch<User>("/auth/me", {}, token);
    setUser(me);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, setToken, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
