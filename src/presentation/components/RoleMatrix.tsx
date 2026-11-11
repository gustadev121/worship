"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/presentation/components/ui/table";

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
  {
    label: string;
    variant: "statusReady" | "statusPracticing" | "statusPending";
  }
> = {
  READY: {
    label: "Lista para servicio",
    variant: "statusReady",
  },
  PRACTICING: {
    label: "Ensayando parte",
    variant: "statusPracticing",
  },
  PENDING: {
    label: "Pendiente de ensayo",
    variant: "statusPending",
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
  const [notesDetail, setNotesDetail] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [savingNotesId, setSavingNotesId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    setIsSubmitting(true);
    try {
      const body: Record<string, unknown> = { userId, roleType };
      if (roleType === "INSTRUMENT" && instrumentName.trim()) {
        body.instrumentName = instrumentName.trim();
      }
      if (roleType !== "INSTRUMENT" && notesDetail.trim()) {
        body.harmonyOrPartNotes = notesDetail.trim();
      }
      await post(`/api/songs/${songId}/roles`, "POST", body);
      setInstrumentName("");
      setNotesDetail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar parte");
    } finally {
      setIsSubmitting(false);
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
      <TableRow key={r.id} className="hover:bg-muted/20 transition-colors">
        {/* Volunteer Identity */}
        <TableCell className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/25 flex items-center justify-center font-bold text-xs shrink-0 select-none">
              {getInitials(username)}
            </div>
            <span className="font-semibold text-foreground text-sm truncate">
              {username}
            </span>
          </div>
        </TableCell>

        {/* Assigned Part */}
        <TableCell className="py-3 px-4">
          {r.roleType === "INSTRUMENT" ? (
            <Badge
              variant="outline"
              size="sm"
              className="bg-chord-accent/10 text-chord-accent border-chord-accent/30 font-medium inline-flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <span>{r.instrumentName || "Instrumento"}</span>
            </Badge>
          ) : (
            <Badge
              variant="secondary"
              size="sm"
              className="font-medium text-foreground/90 inline-flex items-center gap-1.5"
            >
              <svg
                className="w-3.5 h-3.5 text-primary opacity-80"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
              <span>{ROLE_LABELS[r.roleType] ?? r.roleType}</span>
            </Badge>
          )}
        </TableCell>

        {/* Practice Readiness Status */}
        <TableCell className="py-3 px-4">
          <Badge
            variant={statusCfg.variant}
            size="sm"
            dot
            className="font-medium inline-flex items-center"
          >
            {statusCfg.label}
          </Badge>
        </TableCell>

        {/* Harmony / Technical Notes */}
        <TableCell className="py-3 px-4 text-xs text-muted-foreground">
          {isAdmin ? (
            <div className="flex items-center gap-2 max-w-sm">
              <input
                defaultValue={r.harmonyOrPartNotes ?? ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    saveNotes(r.id);
                  }
                }}
                placeholder="Armonía / notas técnicas..."
                className="w-full text-xs px-2.5 py-1.5 rounded-md bg-secondary/60 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden transition-colors"
                aria-label={`Notas para ${username}`}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => saveNotes(r.id)}
                disabled={savingNotesId === r.id}
                className="text-xs h-7 px-2.5 shrink-0"
              >
                {savingNotesId === r.id ? "..." : "Guardar"}
              </Button>
            </div>
          ) : (
            <span className="truncate block max-w-xs">
              {r.harmonyOrPartNotes || "—"}
            </span>
          )}
        </TableCell>

        {/* Admin Delete Action */}
        {isAdmin ? (
          <TableCell className="py-3 px-4 text-right">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => remove(r.id)}
              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-7 w-7 p-0 rounded-md inline-flex items-center justify-center transition-colors"
              title="Quitar asignación"
              aria-label={`Quitar asignación de ${username}`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </Button>
          </TableCell>
        ) : null}
      </TableRow>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Counter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2
              id="role-matrix-title"
              className="text-xl font-bold tracking-tight text-foreground"
            >
              Matriz de Voces e Instrumentos
            </h2>
            <Badge variant="secondary" size="sm" className="font-semibold">
              {roles.length}{" "}
              {roles.length === 1 ? "asignación" : "asignaciones"}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Asignaciones de partes, armonías vocales y estado de preparación del
            equipo.
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium"
        >
          {error}
        </div>
      ) : null}

      {/* Main Table using Shadcn Table primitive */}
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-secondary/40 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
            <TableHead className="py-3 px-4 text-left">Miembro</TableHead>
            <TableHead className="py-3 px-4 text-left">
              Parte Asignada
            </TableHead>
            <TableHead className="py-3 px-4 text-left">
              Estado de Ensayo
            </TableHead>
            <TableHead className="py-3 px-4 text-left">
              Notas Técnicas / Armonía
            </TableHead>
            {isAdmin ? (
              <TableHead className="py-3 px-4 text-right">Acción</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isAdmin ? 5 : 4}
                className="py-8 text-center text-muted-foreground text-sm"
              >
                No hay miembros asignados a esta canción todavía.
              </TableCell>
            </TableRow>
          ) : (
            <>
              {/* Vocal section divider if vocals exist */}
              {vocalRoles.length > 0 ? (
                <TableRow className="bg-secondary/20">
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-primary"
                  >
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                      <span>Voces ({vocalRoles.length})</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
              {vocalRoles.map(renderRoleRow)}

              {/* Instrument section divider if instruments exist */}
              {instrumentRoles.length > 0 ? (
                <TableRow className="bg-secondary/20">
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="py-2 px-4 text-[11px] font-bold uppercase tracking-wider text-chord-accent"
                  >
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="w-3 h-3"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden="true"
                      >
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                      <span>Instrumentos ({instrumentRoles.length})</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : null}
              {instrumentRoles.map(renderRoleRow)}
            </>
          )}
        </TableBody>
      </Table>

      {/* Admin Assign Role Card using Shadcn Card and Button */}
      {isAdmin ? (
        <div className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <svg
                className="w-4 h-4 text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" x2="19" y1="8" y2="14" />
                <line x1="22" x2="16" y1="11" y2="11" />
              </svg>
              <span>Asignar Parte a Integrante</span>
            </h3>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              Coordina los roles del arreglo
            </span>
          </div>

          <form
            onSubmit={assign}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end"
          >
            <div className="space-y-1">
              <label
                htmlFor="assign-member"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Miembro
              </label>
              <select
                id="assign-member"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg bg-secondary/80 border border-border/80 text-foreground focus:border-primary focus:outline-hidden transition-colors"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.username}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="assign-role-type"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                Tipo de Parte
              </label>
              <select
                id="assign-role-type"
                value={roleType}
                onChange={(e) => setRoleType(e.target.value)}
                className="w-full text-xs h-9 px-3 rounded-lg bg-secondary/80 border border-border/80 text-foreground focus:border-primary focus:outline-hidden transition-colors"
              >
                {ROLE_TYPES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r] ?? r}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="assign-detail"
                className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
              >
                {roleType === "INSTRUMENT"
                  ? "Instrumento *"
                  : "Notas de Parte (opc.)"}
              </label>
              <input
                id="assign-detail"
                value={roleType === "INSTRUMENT" ? instrumentName : notesDetail}
                onChange={(e) =>
                  roleType === "INSTRUMENT"
                    ? setInstrumentName(e.target.value)
                    : setNotesDetail(e.target.value)
                }
                placeholder={
                  roleType === "INSTRUMENT"
                    ? "Ej: Teclado, Batería, Bajo"
                    : "Ej: Armonía alta en coro"
                }
                required={roleType === "INSTRUMENT"}
                className="w-full text-xs h-9 px-3 rounded-lg bg-secondary/80 border border-border/80 text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-hidden transition-colors"
              />
            </div>

            <div>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSubmitting}
                className="w-full h-9 gap-1.5 text-xs font-semibold shadow-xs justify-center"
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  aria-hidden="true"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Asignar Parte</span>
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
