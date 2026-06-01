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
  loginWithGoogle: (nextPath?: string) => Promise<{ error?: string }>;
  refresh: () => Promise<void>;
  updateProfile: (payload: Record<string, unknown>) => Promise<{ error?: string }>;
  linkWallet: (address: string) => Promise<{ error?: string }>;
  unlinkWallet: () => Promise<{ error?: string }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseJson(response: Response) {
  return response.json().catch(() => ({}));
}

function buildSupabaseUserSnapshot(input: {
  id: string;
  email: string;
  provider?: string;
}): UserSnapshot {
  const now = new Date().toISOString();

  return {
    id: input.id,
    email: input.email,
    authProvider: input.provider === "google" ? "google" : "email",
    createdAt: now,
    updatedAt: now,
    profile: {
      firstName: "",
      lastName: "",
      phone: "",
      nationalId: "",
      studentCode: "",
      universityId: 0,
      campusId: 1,
      programId: 0,
      studentType: "Pregrado",
      benefitLabel: "Almuerzo Regular"
    },
    linkedWallet: null,
    universityValidated: false,
    syncState: {
      directoryMatched: false,
      profileComplete: false,
      walletLinked: false,
      onchainProfileRegistered: false,
      onchainAffiliationSynced: false
    },
    tickets: {
      available: 0,
      source: "ticket_system"
    },
    notifications: [],
    access: {
      perfil: true,
      tickets: input.email.toLowerCase().endsWith("@correounivalle.edu.co"),
      reciclaje: false,
      marketplace: false,
      dao: false
    },
    completion: {
      profileComplete: false,
      walletLinked: false
    }
  };
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

    let nextUser = sessionJson.user ?? null;

    if (!nextUser) {
      try {
        const { createClient } = await import("@/app/lib/supabase/client");
        const supabase = createClient();
        const {
          data: { user: supabaseUser }
        } = await supabase.auth.getUser();

        if (supabaseUser?.id && supabaseUser.email) {
          nextUser = buildSupabaseUserSnapshot({
            id: supabaseUser.id,
            email: supabaseUser.email,
            provider: supabaseUser.app_metadata?.provider
          });
        }
      } catch {
        nextUser = null;
      }
    }

    setUser(nextUser);
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
        window.location.assign("/");
      },
      async loginWithGoogle(nextPath = "/perfil") {
        try {
          const { createClient } = await import("@/app/lib/supabase/client");
          const supabase = createClient();
          const safeNextPath = nextPath.startsWith("/") ? nextPath : "/perfil";
          const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`;
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
