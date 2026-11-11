"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(
          data?.error ??
            "Credenciales incorrectas. Verifica tu usuario y contraseña.",
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch (_err) {
      setError("Error de conexión. Intenta de nuevo en unos momentos.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xs space-y-6">
        {/* Brand Header */}
        <header className="flex flex-col items-center text-center space-y-2">
          <div
            className="w-10 h-10 rounded-xl bg-primary/15 text-primary border border-primary/25 flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              WorshipFlow
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Inicia sesión para acceder al repertorio y ensayos
            </p>
          </div>
        </header>

        {/* Error Alert Banner */}
        {error ? (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium"
          >
            <svg
              className="w-4 h-4 shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{error}</span>
          </div>
        ) : null}

        {/* Authentication Form */}
        <form onSubmit={submit} className="space-y-4">
          {/* Email / Username Field */}
          <div className="space-y-1.5">
            <label
              htmlFor="identifier"
              className="block text-xs font-semibold text-foreground"
            >
              Usuario o correo electrónico
            </label>
            <input
              id="identifier"
              type="text"
              name="identifier"
              autoComplete="username"
              required
              disabled={isLoading}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="nombre o tu@iglesia.org"
              className="w-full h-9 px-3 text-xs rounded-lg bg-secondary/80 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden transition-colors"
            />
          </div>

          {/* Password Field with Visibility Toggle */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-semibold text-foreground"
            >
              Contraseña
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-9 pl-3 pr-9 text-xs rounded-lg bg-secondary/80 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Ver contraseña"
                }
              >
                {showPassword ? (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-border accent-primary cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Mantener sesión iniciada
            </label>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        {/* Login Footer */}
        <footer className="pt-2 border-t border-border/60 text-center">
          <p className="text-[11px] text-muted-foreground">
            WorshipFlow &middot; Ministerio de Alabanza
          </p>
        </footer>
      </div>
    </main>
  );
}
