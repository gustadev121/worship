"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import type { SessionUser } from "./navbar";
import { ThemeToggle } from "./theme-toggle";

export interface MoreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: SessionUser | null;
  activePath: string;
}

export function MoreDrawer({
  isOpen,
  onClose,
  user,
  activePath,
}: MoreDrawerProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isAdmin = user?.role === "ADMIN";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "WF";

  return (
    <>
      {/* Backdrop */}
      <div
        className="wf-drawer-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <aside
        id="more-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Panel de opciones y navegación"
        className="wf-drawer-sheet"
      >
        <div className="wf-drawer-handle" aria-hidden="true" />

        {/* User Profile Card */}
        {user ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "0.75rem 1rem",
              backgroundColor: "var(--card-elevated)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.125rem",
              }}
            >
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  color: "var(--foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.name}
              </div>
              <div
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--muted-foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {user.email}
              </div>
            </div>
            <Badge
              variant={user.role === "ADMIN" ? "roleAdmin" : "roleMember"}
              size="sm"
            >
              {user.role}
            </Badge>
          </div>
        ) : (
          <div
            style={{
              padding: "1rem",
              backgroundColor: "var(--card-elevated)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 600, color: "var(--foreground)" }}>
              Bienvenido a WorshipFlow
            </div>
            <p
              style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}
            >
              Inicia sesión para sincronizar ensayos, roles y canciones.
            </p>
            <Link
              href="/login"
              onClick={onClose}
              className="wf-btn wf-btn-primary wf-btn-sm"
              style={{ textDecoration: "none", alignSelf: "flex-start" }}
            >
              Iniciar sesión
            </Link>
          </div>
        )}

        {/* Quick Navigation Group */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--muted-foreground)",
            }}
          >
            Navegación Rápida
          </div>
          <Link
            href="/songs/new"
            onClick={onClose}
            className={`wf-nav-item ${activePath === "/songs/new" ? "wf-nav-item-active" : ""}`}
            style={{ textDecoration: "none" }}
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span>Nueva Canción</span>
          </Link>
        </div>

        {/* Admin Group */}
        {isAdmin && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
          >
            <div
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--muted-foreground)",
              }}
            >
              Administración
            </div>
            <Link
              href="/admin/users"
              onClick={onClose}
              className={`wf-nav-item ${activePath === "/admin/users" ? "wf-nav-item-active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Gestión de Usuarios</span>
            </Link>
            <Link
              href="/admin/labels"
              onClick={onClose}
              className={`wf-nav-item ${activePath === "/admin/labels" ? "wf-nav-item-active" : ""}`}
              style={{ textDecoration: "none" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
              <span>Etiquetas de Repertorio</span>
            </Link>
          </div>
        )}

        {/* Preferences Group */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "var(--muted-foreground)",
            }}
          >
            Preferencias
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.5rem 0.75rem",
              borderRadius: "var(--radius-md)",
              backgroundColor: "var(--secondary)",
            }}
          >
            <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>
              Tema visual
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* Session / Close Action */}
        <div style={{ marginTop: "auto", paddingTop: "0.5rem" }}>
          {user ? (
            <form action="/api/auth/logout" method="POST">
              <Button
                type="submit"
                variant="outline"
                className="wf-btn-destructive"
                style={{ width: "100%" }}
              >
                Cerrar sesión
              </Button>
            </form>
          ) : (
            <Button
              variant="outline"
              onClick={onClose}
              style={{ width: "100%" }}
            >
              Cerrar panel
            </Button>
          )}
        </div>
      </aside>
    </>
  );
}
