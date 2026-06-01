"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import AuthPrompt from "@/app/components/AuthPrompt";
import { useAuth } from "@/app/providers/AuthProvider";

function isPublicPath(pathname: string) {
  return pathname === "/" || pathname.startsWith("/auth/callback");
}

export default function AppAuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [search, setSearch] = useState("");

  useEffect(() => {
    setSearch(window.location.search);
  }, [pathname]);

  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  const nextPath = `${pathname}${search}`;

  if (loading) {
    return (
      <main className="auth-screen">
        <section className="auth-phone">
          <article className="auth-card">
            <div className="auth-card__body">
              <h1 className="auth-card__title">Cargando</h1>
              <p className="auth-card__subtitle">Validando tu sesion...</p>
            </div>
          </article>
        </section>
      </main>
    );
  }

  if (!user) {
    return <AuthPrompt nextPath={nextPath} />;
  }

  return <>{children}</>;
}
