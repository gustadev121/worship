"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SessionUser } from "./navbar";

export interface MobileDockProps {
  user: SessionUser | null;
  activePath: string;
  onOpenDrawer: () => void;
  isDrawerOpen: boolean;
}

export function MobileDock({
  user: _user,
  activePath,
  onOpenDrawer,
  isDrawerOpen,
}: MobileDockProps) {
  const [practiceHref, setPracticeHref] = useState("/");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("worshipflow_last_practice_song");
      if (cached) {
        setPracticeHref(`/songs/${cached}/practice`);
      }
    }
  }, []);

  const isCatalogActive =
    activePath === "/" ||
    (activePath.startsWith("/songs") && !activePath.includes("/practice"));

  const isPracticeActive = activePath.includes("/practice");
  const isRoadmapActive = activePath.startsWith("/roadmap");

  return (
    <nav
      className="wf-mobile-dock"
      id="mobile-dock"
      aria-label="Navegación móvil"
    >
      <div className="wf-dock-grid">
        {/* 1. Catálogo */}
        <Link
          href="/"
          className={`wf-dock-item ${isCatalogActive && !isDrawerOpen ? "wf-dock-item-active" : ""}`}
          aria-current={isCatalogActive && !isDrawerOpen ? "page" : undefined}
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
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
          <span>Catálogo</span>
        </Link>

        {/* 2. Ensayo */}
        <Link
          href={practiceHref}
          className={`wf-dock-item ${isPracticeActive && !isDrawerOpen ? "wf-dock-item-active" : ""}`}
          aria-current={isPracticeActive && !isDrawerOpen ? "page" : undefined}
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
            <circle cx="12" cy="12" r="10" />
            <polygon points="10 8 16 12 10 16 10 8" />
          </svg>
          <span>Ensayo</span>
        </Link>

        {/* 3. Roadmap */}
        <Link
          href="/roadmap"
          className={`wf-dock-item ${isRoadmapActive && !isDrawerOpen ? "wf-dock-item-active" : ""}`}
          aria-current={isRoadmapActive && !isDrawerOpen ? "page" : undefined}
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
            <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z" />
            <path d="M12 13v8" />
            <path d="M12 3v3" />
          </svg>
          <span>Roadmap</span>
        </Link>

        {/* 4. Más (Slide-Over Trigger) */}
        <button
          type="button"
          className={`wf-dock-item ${isDrawerOpen ? "wf-dock-item-active" : ""}`}
          onClick={onOpenDrawer}
          aria-expanded={isDrawerOpen}
          aria-controls="more-drawer"
          aria-label="Abrir panel de navegación y ajustes"
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
            <line x1="4" x2="20" y1="12" y2="12" />
            <line x1="4" x2="20" y1="6" y2="6" />
            <line x1="4" x2="20" y1="18" y2="18" />
          </svg>
          <span>Más</span>
        </button>
      </div>
    </nav>
  );
}
