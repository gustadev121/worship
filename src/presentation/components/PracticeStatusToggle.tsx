"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = [
  {
    value: "PENDING",
    label: "Pendiente",
    icon: "○",
    activeClass: "bg-slate-500/20 text-slate-300 border-slate-500/40",
  },
  {
    value: "PRACTICING",
    label: "Ensayando",
    icon: "⋯",
    activeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  {
    value: "READY",
    label: "Listo para Servicio",
    icon: "✓",
    activeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
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
    <div className="practice-status-widget flex flex-wrap items-center gap-3 p-3 rounded-xl bg-card border border-border/80 shadow-xs">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 ${
                isSelected
                  ? `${s.activeClass} shadow-xs ring-1`
                  : "bg-secondary/60 text-muted-foreground border-border hover:text-foreground hover:bg-accent"
              }`}
            >
              <span className="mr-1">{s.icon}</span>
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {saving ? (
        <span className="text-xs text-muted-foreground animate-pulse">
          Guardando...
        </span>
      ) : null}

      {error ? (
        <span role="alert" className="text-xs text-destructive font-medium">
          {error}
        </span>
      ) : null}
    </div>
  );
}
