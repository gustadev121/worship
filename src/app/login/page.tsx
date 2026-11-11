"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/infrastructure/auth/auth-client";

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
      const email = identifier.includes("@")
        ? identifier
        : `${identifier}@worshipflow.local`;

      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      });

      if (result.error) {
        // Fallback to legacy endpoint for existing pre-Better-Auth accounts
        const legacyRes = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, password }),
        });

        if (!legacyRes.ok) {
          setError(
            result.error.message ||
              "Credenciales incorrectas. Verifica tu usuario y contraseña.",
          );
          return;
        }
      }

      router.push("/");
      router.refresh();
    } catch (_err) {
      setError("Error de conexión. Intenta de nuevo en unos momentos.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (_err) {
      setError("No se pudo iniciar sesión con Google.");
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
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
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
            className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
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

        {/* Social Authentication */}
        <div className="space-y-3 pt-1">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/60" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-[10px] text-muted-foreground font-medium">
                o continuar con
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-9 inline-flex items-center justify-center gap-2 rounded-lg text-xs font-medium border border-border/80 bg-secondary/50 text-foreground hover:bg-secondary transition-colors cursor-pointer disabled:opacity-50"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Google</span>
          </button>
        </div>

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
