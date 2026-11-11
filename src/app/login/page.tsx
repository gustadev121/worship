"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { AuroraBackground } from "@/presentation/components/reactbits/aurora-bg";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFailed, setHasFailed] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setHasFailed(false);
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
            "Credenciales incorrectas. Verifica tu correo y contraseña.",
        );
        setHasFailed(true);
        return;
      }

      router.push("/");
      router.refresh();
    } catch (_err) {
      setError("Error de conexión. Intenta de nuevo en unos momentos.");
      setHasFailed(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuroraBackground
      showRadialGradient
      intensity="subtle"
      speed="slow"
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem 1rem",
      }}
    >
      <style>{`
        @keyframes wf-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .wf-login-card-shake {
          animation: wf-shake 0.4s ease-in-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .wf-login-card-shake {
            animation: none;
          }
        }
      `}</style>

      {/* Centered Glassmorphism Authentication Card */}
      <div
        className={`wf-card ${hasFailed ? "wf-login-card-shake" : ""}`}
        style={{
          width: "100%",
          maxWidth: "28rem",
          backgroundColor: "rgba(15, 23, 42, 0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "var(--radius-2xl, 1.5rem)",
          padding: "2.25rem 2rem",
          boxShadow: "var(--shadow-xl)",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
          position: "relative",
          zIndex: 10,
        }}
      >
        {/* Brand Header */}
        <header
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "0.625rem",
          }}
        >
          {/* Insignia Icon with Glow */}
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.4)",
              boxShadow: "0 0 20px -3px rgba(99, 102, 241, 0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.5rem",
              color: "var(--primary)",
            }}
            aria-hidden="true"
          >
            𝄞
          </div>

          <div>
            <h1
              style={{
                fontSize: "1.625rem",
                fontWeight: 800,
                letterSpacing: "-0.025em",
                color: "var(--foreground)",
                margin: 0,
              }}
            >
              WorshipFlow
            </h1>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                margin: "0.25rem 0 0 0",
              }}
            >
              Inicia sesión para acceder al repertorio y ensayos
            </p>
          </div>
        </header>

        {/* High-Visibility Error Alert Banner */}
        {error ? (
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.625rem",
              padding: "0.75rem 1rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              color: "var(--destructive)",
              fontSize: "0.875rem",
              lineHeight: 1.4,
            }}
          >
            <span style={{ fontSize: "1rem" }} aria-hidden="true">
              ⚠️
            </span>
            <span>{error}</span>
          </div>
        ) : null}

        {/* Authentication Form */}
        <form
          onSubmit={submit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          {/* Email / Username Field */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <label
              htmlFor="identifier"
              style={{
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--foreground)",
              }}
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
              className="wf-input"
              style={{
                height: "44px",
                padding: "0 1rem",
                backgroundColor: "var(--input)",
                border: hasFailed
                  ? "1px solid var(--destructive)"
                  : "1px solid var(--input-border)",
                boxShadow: hasFailed
                  ? "0 0 0 2px rgba(239, 68, 68, 0.35)"
                  : "none",
                borderRadius: "var(--radius-md)",
                color: "var(--foreground)",
                fontSize: "0.9375rem",
                outline: "none",
                transition: "border-color 0.15s ease, box-shadow 0.15s ease",
              }}
              onFocus={(e) => {
                if (!hasFailed) {
                  e.currentTarget.style.borderColor = "var(--primary)";
                  e.currentTarget.style.boxShadow = "0 0 0 2px var(--ring)";
                }
              }}
              onBlur={(e) => {
                if (!hasFailed) {
                  e.currentTarget.style.borderColor = "var(--input-border)";
                  e.currentTarget.style.boxShadow = "none";
                }
              }}
            />
          </div>

          {/* Password Field with Visibility Toggle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.375rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <label
                htmlFor="password"
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--foreground)",
                }}
              >
                Contraseña
              </label>
            </div>
            <div style={{ position: "relative" }}>
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
                className="wf-input"
                style={{
                  width: "100%",
                  height: "44px",
                  paddingLeft: "1rem",
                  paddingRight: "3rem",
                  backgroundColor: "var(--input)",
                  border: hasFailed
                    ? "1px solid var(--destructive)"
                    : "1px solid var(--input-border)",
                  boxShadow: hasFailed
                    ? "0 0 0 2px rgba(239, 68, 68, 0.35)"
                    : "none",
                  borderRadius: "var(--radius-md)",
                  color: "var(--foreground)",
                  fontSize: "0.9375rem",
                  outline: "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => {
                  if (!hasFailed) {
                    e.currentTarget.style.borderColor = "var(--primary)";
                    e.currentTarget.style.boxShadow = "0 0 0 2px var(--ring)";
                  }
                }}
                onBlur={(e) => {
                  if (!hasFailed) {
                    e.currentTarget.style.borderColor = "var(--input-border)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                style={{
                  position: "absolute",
                  right: "0.5rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  minWidth: "40px",
                  minHeight: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                  fontSize: "1.1rem",
                  padding: 0,
                  borderRadius: "var(--radius-sm)",
                }}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Ver contraseña"
                }
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              style={{
                width: "18px",
                height: "18px",
                cursor: "pointer",
                accentColor: "var(--primary)",
              }}
            />
            <label
              htmlFor="remember"
              style={{
                fontSize: "0.875rem",
                color: "var(--muted-foreground)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Mantener sesión iniciada
            </label>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="wf-btn wf-btn-primary"
            style={{
              width: "100%",
              height: "44px",
              fontWeight: 700,
              fontSize: "0.9375rem",
              marginTop: "0.5rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            {isLoading ? (
              <>
                <span
                  style={{
                    display: "inline-block",
                    width: "18px",
                    height: "18px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTopColor: "#ffffff",
                    borderRadius: "50%",
                    animation: "wf-spin 0.8s linear infinite",
                  }}
                  aria-hidden="true"
                />
                <style>{`
                  @keyframes wf-spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
                <span>Iniciando sesión...</span>
              </>
            ) : (
              <span>Iniciar Sesión</span>
            )}
          </button>
        </form>

        {/* Login Footer */}
        <footer
          style={{
            textAlign: "center",
            paddingTop: "0.5rem",
            borderTop: "1px solid var(--border-subtle)",
          }}
        >
          <p
            style={{
              fontSize: "0.8125rem",
              color: "var(--muted-foreground)",
              margin: 0,
            }}
          >
            ¿Problemas para acceder? Contacta al director de alabanza.
          </p>
        </footer>
      </div>
    </AuroraBackground>
  );
}
