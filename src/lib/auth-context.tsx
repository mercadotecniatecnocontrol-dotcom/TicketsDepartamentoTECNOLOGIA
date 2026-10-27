"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth-token";

interface AuthContextType {
  user: SessionUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (departamento: string, password: string, rememberMe?: boolean, usuario?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: async () => {},
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Error verificando sesión:", e);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (departamento: string, password: string, rememberMe: boolean = false, usuario?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ departamento, usuario, password, rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || "Error al iniciar sesión" };
      }

      setUser(data.user);
      setIsLoading(false);
      return { success: true };
    } catch {
      setIsLoading(false);
      return { success: false, error: "Error de conexión con el servidor" };
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Error en logout:", e);
    } finally {
      setUser(null);
      setIsLoading(false);
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
}
