"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface RoleRow {
  id: string;
  userId: string;
  roleType: string;
  instrumentName: string | null;
  harmonyOrPartNotes: string | null;
  practiceStatus: string;
}

const ROLE_TYPES = [
  "FIRST_VOICE",
  "SECOND_VOICE",
  "THIRD_VOICE",
  "BACKING_VOCAL",
  "INSTRUMENT",
] as const;

const ROLE_LABELS: Record<string, string> = {
  FIRST_VOICE: "Primera voz (Guía)",
  SECOND_VOICE: "Segunda voz (Armonía alta)",
  THIRD_VOICE: "Tercera voz (Armonía baja)",
  BACKING_VOCAL: "Voces de apoyo",
  INSTRUMENT: "Instrumento",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string }
> = {
  READY: {
    label: "Lista para servicio",
    badgeClass:
      "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 ring-emerald-500/20",
    icon: "✓",
  },
  PRACTICING: {
    label: "Ensayando parte",
    badgeClass:
      "bg-amber-500/15 text-amber-400 border-amber-500/30 ring-amber-500/20",
    icon: "⋯",
  },
  PENDING: {
    label: "Pendiente de ensayo",
    badgeClass:
      "bg-slate-500/15 text-slate-400 border-slate-500/30 ring-slate-500/20",
    icon: "○",
  },
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return "U";
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function RoleMatrix({
  songId,
  roles,
  members,
  isAdmin,
}: {
  songId: string;
  roles: RoleRow[];
  members: { id: string; username: string }[];
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(members[0]?.id ?? "");
  const [roleType, setRoleType] = useState<string>(
    ROLE_TYPES[0] ?? "FIRST_VOICE",
  );
  const [instrumentName, setInstrumentName] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const nameById = new Map(members.map((m) => [m.id, m.username]));

  const vocalRoles = roles.filter((r) => r.roleType !== "INSTRUMENT");
  const instrumentRoles = roles.filter((r) => r.roleType === "INSTRUMENT");

  async function post(path: string, method: string, body?: unknown) {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      throw new Error(data?.error ?? "Error en la solicitud");
    }
    router.refresh();
  }

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const body: Record<string, unknown> = { userId, roleType };
      if (roleType === "INSTRUMENT" && instrumentName.trim()) {
        body.instrumentName = instrumentName.trim();
      }
      await post(`/api/songs/${songId}/roles`, "POST", body);
      setInstrumentName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar parte");
    }
  }

  async function remove(roleId: string) {
    setError(null);
    try {
      await post(`/api/songs/${songId}/roles/${roleId}`, "DELETE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar");
    }
  }

  async function saveNotes(roleId: string) {
    setError(null);
    setSavingNotesId(roleId);
    try {
      await post(`/api/songs/${songId}/roles/${roleId}`, "PATCH", {
        harmonyOrPartNotes: notes[roleId] ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar notas");
    } finally {
      setSavingNotesId(null);
    }
  }

  function renderRoleRow(r: RoleRow) {
    const username = nameById.get(r.userId) ?? r.userId;
    const statusCfg = STATUS_CONFIG[r.practiceStatus] ?? STATUS_CONFIG.PENDING;

    return (
      <tr
        key={r.id}
        className="border-b border-border/40 hover:bg-muted/30 transition-colors"
      >
        {/* Volunteer Identity */}
        <td className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {getInitials(username)}
            </div>
            <span className="font-medium text-foreground text-sm">
              {username}
            </span>
          </div>
        </td>

        {/* Assigned Part */}
        <td className="py-3 px-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
            {r.roleType === "INSTRUMENT"
              ? r.instrumentName || "Instrumento"
              : (ROLE_LABELS[r.roleType] ?? r.roleType)}
          </span>
        </td>

        {/* Practice Readiness Status */}
        <td className="py-3 px-4">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${statusCfg.badgeClass}`}
          >
            <span>{statusCfg.icon}</span>
            <span>{statusCfg.label}</span>
          </span>
        </td>

        {/* Harmony Notes */}
        <td className="py-3 px-4 text-sm text-muted-foreground">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <input
                defaultValue={r.harmonyOrPartNotes ?? ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
                placeholder="Armonía / notas técnicas..."
                className="w-full max-w-xs text-xs px-2.5 py-1.5 rounded-md bg-secondary/60 border border-border focus:border-primary focus:outline-hidden"
                aria-label={`Notas para ${username}`}
              />
              <button
                type="button"
                onClick={() => saveNotes(r.id)}
                disabled={savingNotesId === r.id}
                className="text-xs px-2.5 py-1 rounded bg-secondary hover:bg-accent text-foreground border border-border font-medium transition-colors"
              >
                {savingNotesId === r.id ? "..." : "Guardar"}
              </button>
            </div>
          ) : (
            <span>{r.harmonyOrPartNotes || "—"}</span>
          )}
        </td>

        {/* Admin Delete Action */}
        {isAdmin ? (
          <td className="py-3 px-4 text-right">
            <button
              type="button"
              onClick={() => remove(r.id)}
              className="text-xs text-destructive hover:text-destructive/80 font-medium px-2 py-1 rounded hover:bg-destructive/10 transition-colors"
              title="Quitar asignación"
            >
              Eliminar
            </button>
          </td>
        ) : null}
      </tr>
    );
  }

  return (
    <div className="role-matrix-container space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Matriz de Voces e Instrumentos
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Asignaciones de partes, armonías vocales y estado de preparación del
            equipo.
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm"
        >
          {error}
        </div>
      ) : null}

      {/* Main Table */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Miembro</th>
                <th className="py-3 px-4">Parte Asignada</th>
                <th className="py-3 px-4">Estado de Ensayo</th>
                <th className="py-3 px-4">Notas Técnicas / Armonía</th>
                {isAdmin ? (
                  <th className="py-3 px-4 text-right">Acción</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="py-8 text-center text-muted-foreground text-sm"
                  >
                    No hay miembros asignados a esta canción todavía.
                  </td>
                </tr>
              ) : (
                <>
                  {/* Vocal section divider if vocals exist */}
                  {vocalRoles.length > 0 ? (
                    <tr className="bg-secondary/20">
                      <td
                        colSpan={isAdmin ? 5 : 4}
                        className="py-1 px-4 text-[11px] font-bold uppercase tracking-wider text-primary"
                      >
                        Voces ({vocalRoles.length})
                      </td>
                    </tr>
                  ) : null}
                  {vocalRoles.map(renderRoleRow)}

                  {/* Instrument section divider if instruments exist */}
                  {instrumentRoles.length > 0 ? (
                    <tr className="bg-secondary/20">
                      <td
                        colSpan={isAdmin ? 5 : 4}
                        className="py-1 px-4 text-[11px] font-bold uppercase tracking-wider text-amber-400"
                      >
                        Instrumentos ({instrumentRoles.length})
                      </td>
                    </tr>
                  ) : null}
                  {instrumentRoles.map(renderRoleRow)}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Assign Role Card */}
      {isAdmin ? (
        <form
          onSubmit={assign}
          className="p-4 sm:p-5 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm space-y-4"
        >
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
            Asignar Parte a Integrante
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label
                htmlFor="assign-member"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Miembro
              </label>
              <select
                id="assign-member"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg bg-secondary/80 border border-border text-foreground focus:border-primary focus:outline-hidden"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.username}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="assign-role-type"
                className="block text-xs font-medium text-muted-foreground mb-1"
              >
                Tipo de Parte
              </label>
              <select
                id="assign-role-type"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg bg-secondary/80 border border-border text-foreground focus:border-primary focus:outline-hidden"
              >
                {ROLE_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </select>
            </div>

            {roleType === "INSTRUMENT" ? (
              <div>
                <label
                  htmlFor="assign-instrument"
                  className="block text-xs font-medium text-muted-foreground mb-1"
                >
                  Nombre de Instrumento
                </label>
                <input
                  id="assign-instrument"
                  value={instrumentName}
                  onChange={(e) => setInstrumentName(e.target.value)}
                  placeholder="Ej: Teclado, Batería, Bajo"
                  className="w-full text-sm px-3 py-2 rounded-lg bg-secondary/80 border border-border text-foreground focus:border-primary focus:outline-hidden"
                />
              </div>
            ) : null}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-xs active:scale-95"
            >
              + Asignar Parte
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
