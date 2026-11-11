"use client";

import Link from "next/link";
import { AnimatedGlow } from "../reactbits/animated-glow";
import { Badge } from "../ui/badge";
import { OrganizationSwitcher } from "./organization-switcher";
import { ThemeToggle } from "./theme-toggle";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  activeOrganizationId?: string | null;
  organizations?: readonly {
    id: string;
    name: string;
    slug: string;
    role?: string;
  }[];
}

export interface NavbarProps {
  user: SessionUser | null;
  activePath: string;
  onOpenMobileDrawer?: () => void;
}

export function DesktopNavbar({
  user,
  activePath,
  onOpenMobileDrawer,
}: NavbarProps) {
  const isAdmin = user?.role === "ADMIN";

  const isRouteActive = (path: string) => {
    if (path === "/") return activePath === "/";
    return activePath.startsWith(path);
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "WF";

  return (
    <header className="wf-navbar">
      {/* Brand Cluster */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.625rem",
            textDecoration: "none",
          }}
        >
          <AnimatedGlow glowColor="indigo" intensity="subtle" pulse>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "var(--radius-md)",
                backgroundColor: "var(--primary)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "1.125rem",
              }}
              aria-hidden="true"
            >
              <svg
                width="20"
                height="20"
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
          </AnimatedGlow>
          <div
            style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}
          >
            <span
              style={{
                fontSize: "1.125rem",
                fontWeight: 700,
                letterSpacing: "-0.025em",
                color: "var(--foreground)",
              }}
            >
              WorshipFlow
            </span>
            <span
              style={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                backgroundColor: "var(--muted)",
                padding: "0.1rem 0.4rem",
                borderRadius: "var(--radius-sm)",
              }}
            >
              v0.2
            </span>
          </div>
        </Link>
      </div>

      {/* Primary Navigation Links (Desktop) */}
      <nav className="wf-nav-links" aria-label="Navegación principal">
        <Link
          href="/"
          className={`wf-nav-item ${isRouteActive("/") && activePath === "/" ? "wf-nav-item-active" : ""}`}
          aria-current={activePath === "/" ? "page" : undefined}
        >
          Catálogo
        </Link>

        {user && (
          <Link
            href="/songs/new"
            className={`wf-nav-item ${isRouteActive("/songs/new") ? "wf-nav-item-active" : ""}`}
            aria-current={isRouteActive("/songs/new") ? "page" : undefined}
          >
            Nueva canción
          </Link>
        )}

        {isAdmin && (
          <>
            <Link
              href="/admin/users"
              className={`wf-nav-item ${isRouteActive("/admin/users") ? "wf-nav-item-active" : ""}`}
              aria-current={isRouteActive("/admin/users") ? "page" : undefined}
            >
              Usuarios
            </Link>
            <Link
              href="/admin/labels"
              className={`wf-nav-item ${isRouteActive("/admin/labels") ? "wf-nav-item-active" : ""}`}
              aria-current={isRouteActive("/admin/labels") ? "page" : undefined}
            >
              Etiquetas
            </Link>
            <Link
              href="/admin/organization"
              className={`wf-nav-item ${isRouteActive("/admin/organization") ? "wf-nav-item-active" : ""}`}
              aria-current={
                isRouteActive("/admin/organization") ? "page" : undefined
              }
            >
              Sedes
            </Link>
          </>
        )}
      </nav>

      {/* Utility Cluster (Right) */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        {user ? (
          <OrganizationSwitcher
            currentOrganizationId={user.activeOrganizationId ?? null}
            organizations={user.organizations}
          />
        ) : null}

        <ThemeToggle />

        {user ? (
          <div
            style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}
          >
            <Badge
              variant={user.role === "ADMIN" ? "roleAdmin" : "roleMember"}
              size="sm"
            >
              {user.role}
            </Badge>

            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "var(--radius-full)",
                backgroundColor: "var(--secondary)",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}
              title={`${user.name} (${user.email})`}
            >
              {initials}
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="wf-btn wf-btn-ghost wf-btn-sm"
                style={{
                  fontSize: "0.75rem",
                  padding: "0.25rem 0.5rem",
                  cursor: "pointer",
                }}
                title="Cerrar sesión"
              >
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/login"
            className="wf-btn wf-btn-outline wf-btn-sm"
            style={{ textDecoration: "none" }}
          >
            Iniciar sesión
          </Link>
        )}

        {/* Mobile menu trigger */}
        {onOpenMobileDrawer && (
          <button
            type="button"
            className="wf-btn-icon"
            onClick={onOpenMobileDrawer}
            style={{ display: "none" }}
            aria-label="Abrir menú"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </header>
  );
}
