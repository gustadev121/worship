"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  {
    value: "PENDING",
    label: "Pendiente",
    activeClass: "bg-secondary text-foreground border-border font-semibold",
    dotClass: "bg-muted-foreground",
  },
  {
    value: "PRACTICING",
    label: "Ensayando",
    activeClass:
      "bg-amber-500/15 text-amber-300 border-amber-500/40 font-semibold",
    dotClass: "bg-amber-400",
  },
  {
    value: "READY",
    label: "Listo",
    activeClass:
      "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-semibold",
    dotClass: "bg-emerald-400",
  },
];

export function PracticeStatusToggle({
  songId,
  roleId,
  initial,
}: {
  songId: string;
  roleId: string;
  initial: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    if (saving || next === status) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/songs/${songId}/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ practiceStatus: next }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Error al actualizar estado");
      return;
    }
    setStatus(next);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-card border border-border/80 shadow-xs">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mr-1">
        Tu Estado:
      </span>

      <div className="flex items-center gap-1.5">
        {STATUSES.map((s) => {
          const isSelected = status === s.value;
          return (
            <button
              key={s.value}
              type="button"
              disabled={saving}
              onClick={() => change(s.value)}
              className={`h-7 px-2.5 inline-flex items-center gap-1.5 rounded-md text-xs border transition-colors ${
                isSelected
                  ? s.activeClass
                  : "bg-secondary/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-secondary/70"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${s.dotClass}`}
                aria-hidden="true"
              />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {saving ? (
        <span className="text-xs text-muted-foreground animate-pulse ml-1">
          Guardando...
        </span>
      ) : null}

      {error ? (
        <span
          role="alert"
          className="text-xs text-destructive font-medium ml-1"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
