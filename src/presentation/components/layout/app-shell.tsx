"use client";

import { usePathname } from "next/navigation";
import { type ReactNode, useState } from "react";
import { MobileDock } from "./mobile-dock";
import { MoreDrawer } from "./more-drawer";
import { DesktopNavbar, type SessionUser } from "./navbar";

export type { SessionUser };

export interface AppShellProps {
  children: ReactNode;
  user?: SessionUser | null;
  activePath?: string;
}

export function AppShell({
  children,
  user = null,
  activePath: explicitPath,
}: AppShellProps) {
  const pathname = usePathname();
  const currentPath = explicitPath || pathname || "/";
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="wf-app-shell">
      <DesktopNavbar
        user={user}
        activePath={currentPath}
        onOpenMobileDrawer={() => setIsDrawerOpen(true)}
      />

      <main className="wf-app-main" id="main-content">
        {children}
      </main>

      <MobileDock
        user={user}
        activePath={currentPath}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        isDrawerOpen={isDrawerOpen}
      />

      <MoreDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        user={user}
        activePath={currentPath}
      />
    </div>
  );
}
