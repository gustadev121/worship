"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/infrastructure/auth/auth-client";
import { OrganizationModal } from "../organization/organization-modal";

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  role?: string;
}

export interface OrganizationSwitcherProps {
  readonly currentOrganizationId: string | null;
  readonly organizations?: readonly OrganizationItem[];
  readonly onSelectOrganization?: (organizationId: string) => Promise<void>;
  readonly onCreateOrganization?: () => void;
}

export function OrganizationSwitcher({
  currentOrganizationId,
  organizations = [],
  onSelectOrganization,
  onCreateOrganization,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const activeOrg = organizations.find(
    (org) => org.id === currentOrganizationId,
  ) ??
    organizations[0] ?? {
      id: "worshipflow-central",
      name: "WorshipFlow Central",
      slug: "worshipflow-central",
    };

  async function handleSelect(orgId: string) {
    if (orgId === currentOrganizationId || isSwitching) return;
    setIsSwitching(true);
    setIsOpen(false);

    try {
      if (onSelectOrganization) {
        await onSelectOrganization(orgId);
      } else {
        await authClient.organization.setActive({ organizationId: orgId });
      }
      router.refresh();
    } catch (err) {
      console.error("Error al cambiar de organización:", err);
    } finally {
      setIsSwitching(false);
    }
  }

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSwitching}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-secondary/80 hover:bg-secondary text-foreground border border-border/80 transition-colors cursor-pointer disabled:opacity-60"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="Cambiar organización activa"
      >
        {/* Church / Organization Icon */}
        <svg
          className="w-3.5 h-3.5 text-primary shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
          <path d="M2 20h20" />
          <path d="M14 12v.01" />
          <path d="M10 12v.01" />
          <path d="M10 16v.01" />
          <path d="M14 16v.01" />
          <path d="M10 8v.01" />
          <path d="M14 8v.01" />
        </svg>

        <span className="max-w-[130px] truncate font-semibold">
          {activeOrg.name}
        </span>

        {isSwitching ? (
          <span className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
        ) : (
          <svg
            className={`w-3 h-3 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute left-0 mt-1.5 w-56 rounded-xl border border-border bg-card shadow-lg z-50 py-1 focus:outline-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-border/60">
            <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
              Organizaciones
            </p>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {organizations.length > 0 ? (
              organizations.map((org) => {
                const isSelected = org.id === currentOrganizationId;
                return (
                  <button
                    key={org.id}
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelect(org.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-primary/10 text-primary font-semibold"
                        : "text-foreground hover:bg-secondary/70"
                    }`}
                  >
                    <div className="truncate pr-2">
                      <p className="truncate">{org.name}</p>
                      {org.role ? (
                        <p className="text-[10px] text-muted-foreground capitalize">
                          {org.role}
                        </p>
                      ) : null}
                    </div>
                    {isSelected && (
                      <svg
                        className="w-3.5 h-3.5 text-primary shrink-0"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                {activeOrg.name}
              </div>
            )}
          </div>

          <div className="pt-1 border-t border-border/60 px-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                if (onCreateOrganization) {
                  onCreateOrganization();
                } else {
                  setIsModalOpen(true);
                }
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors cursor-pointer"
            >
              <svg
                className="w-3.5 h-3.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="6" y1="12" x2="18" y2="12" />
              </svg>
              <span>Nueva organización</span>
            </button>
          </div>
        </div>
      )}

      <OrganizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeOrganizationId={currentOrganizationId}
      />
    </div>
  );
}
