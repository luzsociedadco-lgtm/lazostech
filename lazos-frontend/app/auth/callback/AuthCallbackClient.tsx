"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/app/lib/supabase/client";
import { useAuth } from "@/app/providers/AuthProvider";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [message, setMessage] = useState("Validando ingreso...");
  const hasProcessedCallback = useRef(false);

  useEffect(() => {
    if (hasProcessedCallback.current) return;
    hasProcessedCallback.current = true;

    let mounted = true;

    async function completeSignIn() {
      const code = searchParams.get("code");
      const nextParam = searchParams.get("next");
      const next = nextParam?.startsWith("/") ? nextParam : "/perfil";

      if (!code) {
        router.replace("/?auth=callback-error");
        return;
      }

      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        router.replace(`/?auth=callback-error&reason=${encodeURIComponent(error.message)}`);
        return;
      }

      if (mounted) {
        setMessage("Ingreso confirmado. Abriendo perfil...");
      }

      await refresh();
      router.replace(next);
    }

    completeSignIn().catch(error => {
      router.replace(`/?auth=callback-error&reason=${encodeURIComponent(String(error))}`);
    });

    return () => {
      mounted = false;
    };
  }, [refresh, router, searchParams]);

  return (
    <main className="auth-screen">
      <section className="auth-phone">
        <article className="auth-card">
          <div className="auth-card__body">
            <h1 className="auth-card__title">Conectando</h1>
            <p className="auth-card__subtitle">{message}</p>
          </div>
        </article>
      </section>
    </main>
  );
}
