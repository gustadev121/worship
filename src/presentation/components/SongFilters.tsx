"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MUSICAL_KEYS, type MusicalKey } from "@/core/domain/keys";

export interface FilterLabel {
  id: string;
  name: string;
  colorHex?: string;
}

const ROLE_TYPES = [
  "FIRST_VOICE",
  "SECOND_VOICE",
  "THIRD_VOICE",
  "BACKING_VOCAL",
  "INSTRUMENT",
] as const;

const ROLE_LABELS: Record<string, string> = {
  FIRST_VOICE: "1ª Voz",
  SECOND_VOICE: "2ª Voz",
  THIRD_VOICE: "3ª Voz",
  BACKING_VOCAL: "Coro",
  INSTRUMENT: "Instrumento",
};

// Popular worship keys highlighted first in quick-pick bar
const PRIMARY_KEYS: readonly MusicalKey[] = [
  "G major",
  "D major",
  "C major",
  "E major",
  "A major",
  "B major",
  "F major",
  "Bb major",
  "E minor",
  "A minor",
  "B minor",
  "D minor",
];

export function SongFilters({ labels }: { labels: FilterLabel[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialQ = searchParams.get("q") ?? "";
  const initialKey = searchParams.get("practiceKey") ?? "";
  const initialRole = searchParams.get("roleType") ?? "";
  const initialMine = searchParams.get("mine") === "1";
  const initialLabels = (searchParams.get("labels") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const [q, setQ] = useState(initialQ);
  const [practiceKey, setPracticeKey] = useState(initialKey);
  const [roleType, setRoleType] = useState(initialRole);
  const [selectedLabels, setSelectedLabels] = useState<string[]>(initialLabels);
  const [mine, setMine] = useState(initialMine);
  const [showAllKeys, setShowAllKeys] = useState(false);

  // Sync internal state when URL parameters change externally
  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
    setPracticeKey(searchParams.get("practiceKey") ?? "");
    setRoleType(searchParams.get("roleType") ?? "");
    setMine(searchParams.get("mine") === "1");
    setSelectedLabels(
      (searchParams.get("labels") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }, [searchParams]);

  const applyFilters = useCallback(
    (nextState: {
      q?: string;
      practiceKey?: string;
      roleType?: string;
      selectedLabels?: string[];
      mine?: boolean;
    }) => {
      const targetQ = nextState.q !== undefined ? nextState.q : q;
      const targetKey =
        nextState.practiceKey !== undefined
          ? nextState.practiceKey
          : practiceKey;
      const targetRole =
        nextState.roleType !== undefined ? nextState.roleType : roleType;
      const targetLabels =
        nextState.selectedLabels !== undefined
          ? nextState.selectedLabels
          : selectedLabels;
      const targetMine = nextState.mine !== undefined ? nextState.mine : mine;

      const next = new URLSearchParams();
      if (targetQ.trim()) {
        next.set("q", targetQ.trim());
      }
      if (targetLabels.length > 0) {
        next.set("labels", targetLabels.join(","));
      }
      if (targetKey) {
        next.set("practiceKey", targetKey);
      }
      if (targetRole) {
        next.set("roleType", targetRole);
      }
      if (targetMine) {
        next.set("mine", "1");
      }

      const qs = next.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [q, practiceKey, roleType, selectedLabels, mine, router],
  );

  // Debounced search query sync (250ms delay)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    const currentParam = searchParams.get("q") ?? "";
    if (q === currentParam) {
      return;
    }

    const timer = setTimeout(() => {
      applyFilters({ q });
    }, 250);

    return () => clearTimeout(timer);
  }, [q, applyFilters, searchParams]);

  const toggleLabel = (labelId: string) => {
    const next = selectedLabels.includes(labelId)
      ? selectedLabels.filter((id) => id !== labelId)
      : [...selectedLabels, labelId];
    setSelectedLabels(next);
    applyFilters({ selectedLabels: next });
  };

  const toggleKey = (key: string) => {
    const next = practiceKey === key ? "" : key;
    setPracticeKey(next);
    applyFilters({ practiceKey: next });
  };

  const toggleMine = () => {
    const next = !mine;
    setMine(next);
    applyFilters({ mine: next });
  };

  const resetAllFilters = () => {
    setQ("");
    setPracticeKey("");
    setRoleType("");
    setSelectedLabels([]);
    setMine(false);
    router.push("/");
  };

  const hasActiveFilters = Boolean(
    q.trim() || practiceKey || roleType || selectedLabels.length > 0 || mine,
  );

  const displayedKeys = showAllKeys ? MUSICAL_KEYS : PRIMARY_KEYS;

  return (
    <div
      className="wf-filters-sticky"
      style={{
        position: "sticky",
        top: "64px",
        zIndex: 30,
        backgroundColor: "rgba(9, 13, 22, 0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "1rem 0",
        marginBottom: "1.5rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          maxWidth: "80rem",
          margin: "0 auto",
        }}
      >
        {/* Main Search and Quick Controls Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
          }}
        >
          {/* Debounced Search Text Input */}
          <div
            style={{
              position: "relative",
              flex: "1 1 280px",
              minWidth: "220px",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: "0.875rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--muted-foreground)",
                pointerEvents: "none",
                fontSize: "1rem",
              }}
              aria-hidden="true"
            >
              🔍
            </span>
            <input
              type="search"
              name="q"
              placeholder="Buscar por título o artista..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="wf-input"
              style={{
                width: "100%",
                height: "44px",
                paddingLeft: "2.5rem",
                paddingRight: q ? "2.5rem" : "1rem",
                backgroundColor: "var(--input)",
                border: "1px solid var(--input-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--foreground)",
                fontSize: "0.9375rem",
                outline: "none",
              }}
              aria-label="Buscar canciones por título o artista"
            />
            {q ? (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  applyFilters({ q: "" });
                }}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "var(--muted-foreground)",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: "0.25rem",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            ) : null}
          </div>

          {/* Role Type Filter Select */}
          <div style={{ flex: "0 0 auto" }}>
            <select
              value={roleType}
              onChange={(e) => {
                const val = e.target.value;
                setRoleType(val);
                applyFilters({ roleType: val });
              }}
              className="wf-input"
              style={{
                height: "44px",
                padding: "0 1rem",
                backgroundColor: "var(--input)",
                border: "1px solid var(--input-border)",
                borderRadius: "var(--radius-md)",
                color: "var(--foreground)",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
              aria-label="Filtrar por tipo de voz o instrumento"
            >
              <option value="">Todas las voces</option>
              {ROLE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </select>
          </div>

          {/* Mine Toggle Button */}
          <button
            type="button"
            onClick={toggleMine}
            className={`wf-btn wf-btn-sm ${mine ? "wf-btn-primary" : "wf-btn-outline"}`}
            style={{
              height: "44px",
              padding: "0 1rem",
              fontSize: "0.875rem",
            }}
            aria-pressed={mine}
          >
            👤 Mis partes
          </button>
        </div>

        {/* Canonical Musical Key Selector Pills */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.375rem",
            flexWrap: "wrap",
            paddingTop: "0.25rem",
          }}
        >
          <span
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: "var(--muted-foreground)",
              marginRight: "0.25rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Tono:
          </span>
          {displayedKeys.map((k) => {
            const isSelected = practiceKey === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => toggleKey(k)}
                className={`wf-badge ${isSelected ? "wf-badge-key-practice" : "wf-badge-secondary"}`}
                style={{
                  cursor: "pointer",
                  border: isSelected
                    ? "1px solid var(--chord-accent-border)"
                    : "1px solid var(--border)",
                  fontSize: "0.75rem",
                  padding: "0.3rem 0.6rem",
                  transition: "all 0.15s ease",
                  transform: isSelected ? "scale(1.05)" : "none",
                }}
                aria-pressed={isSelected}
              >
                {k}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setShowAllKeys(!showAllKeys)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--primary)",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              padding: "0.25rem 0.5rem",
            }}
          >
            {showAllKeys ? "Ver menos tonos" : "+ Ver los 24 tonos"}
          </button>
        </div>

        {/* Repertoire Label Filter Badges */}
        {labels.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.375rem",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--muted-foreground)",
                marginRight: "0.25rem",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Etiquetas:
            </span>
            {labels.map((label) => {
              const isSelected = selectedLabels.includes(label.id);
              const customHex = label.colorHex;
              return (
                <button
                  key={label.id}
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className="wf-badge"
                  style={{
                    cursor: "pointer",
                    fontSize: "0.75rem",
                    padding: "0.3rem 0.65rem",
                    borderRadius: "9999px",
                    border: isSelected
                      ? `2px solid ${customHex ?? "var(--primary)"}`
                      : "1px solid var(--border)",
                    backgroundColor: isSelected
                      ? customHex
                        ? `${customHex}33`
                        : "var(--primary)"
                      : "var(--secondary)",
                    color: isSelected
                      ? (customHex ?? "#ffffff")
                      : "var(--muted-foreground)",
                    fontWeight: isSelected ? 700 : 500,
                    transition: "all 0.15s ease",
                  }}
                  aria-pressed={isSelected}
                >
                  {isSelected ? "✓ " : ""}
                  {label.name}
                </button>
              );
            })}
          </div>
        ) : null}

        {/* Active Filters Summary & Reset Action */}
        {hasActiveFilters ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "0.5rem",
              paddingTop: "0.5rem",
              borderTop: "1px dashed var(--border)",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: "0.8125rem",
                  color: "var(--muted-foreground)",
                }}
              >
                Filtros activos:
              </span>
              {q ? (
                <span className="wf-badge wf-badge-sm wf-badge-outline">
                  Texto: "{q}"
                </span>
              ) : null}
              {practiceKey ? (
                <span className="wf-badge wf-badge-sm wf-badge-key-practice">
                  Tono: {practiceKey}
                </span>
              ) : null}
              {roleType ? (
                <span className="wf-badge wf-badge-sm wf-badge-secondary">
                  Voz: {ROLE_LABELS[roleType] ?? roleType}
                </span>
              ) : null}
              {mine ? (
                <span className="wf-badge wf-badge-sm wf-badge-secondary">
                  Solo mis partes
                </span>
              ) : null}
              {selectedLabels.map((id) => {
                const match = labels.find((l) => l.id === id);
                return (
                  <span
                    key={id}
                    className="wf-badge wf-badge-sm wf-badge-secondary"
                  >
                    🏷️ {match?.name ?? id}
                  </span>
                );
              })}
            </div>

            <button
              type="button"
              onClick={resetAllFilters}
              className="wf-btn wf-btn-ghost wf-btn-sm"
              style={{
                color: "var(--destructive)",
                fontSize: "0.8125rem",
                padding: "0.25rem 0.5rem",
              }}
            >
              Limpiar todos los filtros ✕
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
