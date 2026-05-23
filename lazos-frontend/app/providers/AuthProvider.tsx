"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

import type { UniversityDirectory, UserSnapshot } from "@/app/lib/types";

type AuthContextValue = {
  user: UserSnapshot | null;
  catalog: UniversityDirectory | null;
  loading: boolean;
  login: (payload: { email: string; password: string }) => Promise<{ error?: string }>;
  register: (payload: { email: string; password: string }) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
  updateProfile: (payload: Record<string, unknown>) => Promise<{ error?: string }>;
  linkWallet: (address: string) => Promise<{ error?: string }>;
  unlinkWallet: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSnapshot | null>(null);
  const [catalog, setCatalog] = useState<UniversityDirectory | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [sessionResponse, catalogResponse] = await Promise.all([
      fetch("/api/auth/session", { cache: "no-store" }),
      fetch("/api/catalog", { cache: "no-store" })
    ]);

    const sessionJson = await parseJson(sessionResponse);
    const catalogJson = await parseJson(catalogResponse);

    setUser(sessionJson.user ?? null);
    setCatalog(catalogJson ?? null);
  };

  const syncSession = async (fallbackUser?: UserSnapshot | null) => {
    await refresh();

    if (fallbackUser) {
      setUser(current => current ?? fallbackUser);
    }
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      catalog,
      loading,
      refresh,
      async login(payload) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await parseJson(response);
        if (!response.ok) {
          return { error: json.error || "No se pudo iniciar sesion" };
        }
        await syncSession(json.user ?? null);
        return {};
      },
      async register(payload) {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await parseJson(response);
        if (!response.ok) {
          return { error: json.error || "No se pudo crear la cuenta" };
        }
        if (json.message && !json.user) {
          return { error: json.message };
        }
        await syncSession(json.user ?? null);
        return {};
      },
      async logout() {
        await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        setUser(null);
      },
      async loginWithGoogle() {
        try {
          const { createClient } = await import("@/app/lib/supabase/client");
          const supabase = createClient();
          const redirectTo = `${window.location.origin}/auth/callback?next=/perfil`;
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo
            }
          });

          if (error) {
            return { error: error.message };
          }

          return {};
        } catch {
          return { error: "No se pudo iniciar sesion con Google" };
        }
      },
      async updateProfile(payload) {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const json = await parseJson(response);
        if (!response.ok) {
          return { error: json.error || "No se pudo actualizar el perfil" };
        }
        setUser(json.user ?? null);
        return {};
      },
      async linkWallet(address) {
        const response = await fetch("/api/wallet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address })
        });
        const json = await parseJson(response);
        if (!response.ok) {
          return { error: json.error || "No se pudo vincular la wallet" };
        }
        setUser(json.user ?? null);
        return {};
      },
      async unlinkWallet() {
        const response = await fetch("/api/wallet", { method: "DELETE" });
        const json = await parseJson(response);
        if (!response.ok) {
          return { error: json.error || "No se pudo desvincular la wallet" };
        }
        setUser(json.user ?? null);
        return {};
      }
    }),
    [catalog, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
