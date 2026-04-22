"use client";

import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/providers/AuthProvider";

type AuthMode = "signup" | "signin";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.4a4.62 4.62 0 0 1-2 3.03v2.52h3.24c1.9-1.75 2.96-4.32 2.96-7.54Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.96-.9 6.61-2.43l-3.24-2.52c-.9.6-2.06.95-3.37.95-2.59 0-4.79-1.75-5.57-4.1H3.08v2.58A9.99 9.99 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.43 13.9A6 6 0 0 1 6.12 12c0-.66.11-1.3.31-1.9V7.52H3.08A10 10 0 0 0 2 12c0 1.61.38 3.13 1.08 4.48l3.35-2.58Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.98c1.47 0 2.8.5 3.84 1.48l2.88-2.88C16.95 2.93 14.69 2 12 2A9.99 9.99 0 0 0 3.08 7.52l3.35 2.58c.78-2.35 2.98-4.12 5.57-4.12Z"
      />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const { user, loading, login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/perfil");
    }
  }, [loading, router, user]);

  const copy = useMemo(
    () =>
      mode === "signup"
        ? {
            title: "Crear Cuenta",
            subtitle: "Registra tu email para entrar a la app y comenzar el onboarding.",
            button: "Crear cuenta"
          }
        : {
            title: "Iniciar Sesion",
            subtitle: "Ingresa con tu cuenta para retomar tu proceso.",
            button: "Entrar"
          },
    [mode]
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const action = mode === "signup" ? register : login;
    const result = await action({ email, password });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.replace("/perfil");
  };

  return (
    <main className="auth-screen">
      <section className="auth-phone">
        <div className="auth-brand">
          <Image
            src="/lazosGO.png"
            alt="LazosTech"
            width={82}
            height={82}
            className="auth-brand__mark"
            priority
          />
          <p className="auth-brand__text">$LAZOS.GO</p>
        </div>

        <article className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Autenticacion">
            <button
              className={`auth-tab ${mode === "signup" ? "is-active" : ""}`}
              onClick={() => setMode("signup")}
              type="button"
            >
              Crear Cuenta
            </button>
            <button
              className={`auth-tab ${mode === "signin" ? "is-active" : ""}`}
              onClick={() => setMode("signin")}
              type="button"
            >
              Iniciar Sesion
            </button>
          </div>

          <div className="auth-card__body">
            <h1 className="auth-card__title">{copy.title}</h1>
            <p className="auth-card__subtitle">{copy.subtitle}</p>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label className="auth-field">
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Email"
                  aria-label="Email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                />
              </label>

              <label className="auth-field">
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  aria-label="Password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                />
                <button
                  className="auth-field__icon"
                  type="button"
                  aria-label={showPassword ? "Ocultar password" : "Mostrar password"}
                  onClick={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
              </label>

              {error ? <p className="auth-error">{error}</p> : null}

              <button className="auth-submit" type="submit" disabled={submitting}>
                {submitting ? "Procesando..." : copy.button}
              </button>

              <p className="auth-separator">
                Google queda listo como siguiente integracion OAuth real.
              </p>

              <button className="auth-google is-disabled" type="button" disabled>
                <GoogleIcon />
                <span>Google pendiente</span>
              </button>
            </form>
          </div>
        </article>
      </section>
    </main>
  );
}
