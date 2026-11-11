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
  BACKING_VOCAL: "Voces de apoyo",
  INSTRUMENT: "Instrumento",
};

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

  const clearAll = () => {
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
    <div className="space-y-3 p-4 rounded-xl border border-border/80 bg-card/60 shadow-xs">
      {/* Primary Search and Quick Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        {/* Search Input with Vector SVG */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="search"
            name="q"
            placeholder="Buscar por título o artista..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full h-9 pl-9 pr-8 text-xs rounded-lg bg-secondary/80 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden transition-colors"
            aria-label="Buscar canciones por título o artista"
          />
          {q ? (
            <button
              type="button"
              onClick={() => {
                setQ("");
                applyFilters({ q: "" });
              }}
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted-foreground hover:text-foreground"
              aria-label="Limpiar búsqueda"
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : null}
        </div>

        {/* Role Type Filter Select */}
        <div className="shrink-0">
          <select
            value={roleType}
            onChange={(e) => {
              const val = e.target.value;
              setRoleType(val);
              applyFilters({ roleType: val });
            }}
            className="w-full sm:w-auto h-9 px-3 text-xs rounded-lg bg-secondary/80 border border-border/80 text-foreground focus:border-primary focus:outline-hidden transition-colors"
            aria-label="Filtrar por tipo de voz o instrumento"
          >
            <option value="">Todas las partes</option>
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
          className={`h-9 px-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition-colors shrink-0 ${
            mine
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/60 text-muted-foreground border-border/80 hover:text-foreground"
          }`}
          aria-pressed={mine}
        >
          <svg
            className="w-3.5 h-3.5 opacity-80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Mis partes</span>
        </button>

        {/* Clear All Filters Button */}
        {hasActiveFilters ? (
          <button
            type="button"
            onClick={clearAll}
            className="h-9 px-3 inline-flex items-center gap-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 border border-transparent transition-colors shrink-0"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            <span>Limpiar</span>
          </button>
        ) : null}
      </div>

      {/* Musical Key Selector Pills */}
      <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
          Tono:
        </span>
        {displayedKeys.map((k) => {
          const isSelected = practiceKey === k;
          return (
            <button
              key={k}
              type="button"
              onClick={() => toggleKey(k)}
              className={`h-6 px-2 rounded-md text-[11px] font-mono font-medium border transition-colors ${
                isSelected
                  ? "bg-chord-accent/20 text-chord-accent border-chord-accent/40 font-bold"
                  : "bg-secondary/50 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary"
              }`}
            >
              {k}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setShowAllKeys((prev) => !prev)}
          className="h-6 px-2 text-[11px] font-medium text-primary hover:underline"
        >
          {showAllKeys ? "Menos" : "+ Todos"}
        </button>
      </div>

      {/* Label Pills */}
      {labels.length > 0 ? (
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-border/40">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1">
            Etiquetas:
          </span>
          {labels.map((lbl) => {
            const isSelected = selectedLabels.includes(lbl.id);
            return (
              <button
                key={lbl.id}
                type="button"
                onClick={() => toggleLabel(lbl.id)}
                className={`h-6 px-2.5 rounded-full text-[11px] font-medium border transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/70"
                }`}
                style={
                  !isSelected && lbl.colorHex
                    ? {
                        borderColor: `${lbl.colorHex}50`,
                        color: lbl.colorHex,
                      }
                    : undefined
                }
              >
                {lbl.name}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
