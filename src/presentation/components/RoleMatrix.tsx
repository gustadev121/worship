"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/presentation/components/ui/badge";
import { Button } from "@/presentation/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/presentation/components/ui/card";
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
    icon: string;
  }
> = {
  READY: {
    label: "Lista para servicio",
    variant: "statusReady",
    icon: "✓",
  },
  PRACTICING: {
    label: "Ensayando parte",
    variant: "statusPracticing",
    icon: "⋯",
  },
  PENDING: {
    label: "Pendiente de ensayo",
    variant: "statusPending",
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
      <TableRow key={r.id} className="hover:bg-muted/30 transition-colors">
        {/* Volunteer Identity */}
        <TableCell className="py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              {getInitials(username)}
            </div>
            <span className="font-medium text-foreground text-sm">
              {username}
            </span>
          </div>
        </TableCell>

        {/* Assigned Part */}
        <TableCell className="py-3 px-4">
          <Badge variant="secondary" size="sm">
            {r.roleType === "INSTRUMENT"
              ? r.instrumentName || "Instrumento"
              : (ROLE_LABELS[r.roleType] ?? r.roleType)}
          </Badge>
        </TableCell>

        {/* Practice Readiness Status */}
        <TableCell className="py-3 px-4">
          <Badge variant={statusCfg.variant} size="sm" className="gap-1.5">
            <span>{statusCfg.icon}</span>
            <span>{statusCfg.label}</span>
          </Badge>
        </TableCell>

        {/* Harmony Notes */}
        <TableCell className="py-3 px-4 text-sm text-muted-foreground">
          {isAdmin ? (
            <div className="flex items-center gap-2">
              <input
                defaultValue={r.harmonyOrPartNotes ?? ""}
                onChange={(e) =>
                  setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                }
                placeholder="Armonía / notas técnicas..."
                className="w-full max-w-[180px] sm:max-w-xs text-xs px-2.5 py-1.5 rounded-md bg-secondary/60 border border-border text-foreground focus:border-primary focus:outline-hidden"
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
            <span>{r.harmonyOrPartNotes || "—"}</span>
          )}
        </TableCell>

        {/* Admin Delete Action */}
        {isAdmin ? (
          <TableCell className="py-3 px-4 text-right">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => remove(r.id)}
              className="text-xs h-7 px-2.5"
              title="Quitar asignación"
            >
              Eliminar
            </Button>
          </TableCell>
        ) : null}
      </TableRow>
    );
  }

  return (
    <div className="role-matrix-container space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          Matriz de Voces e Instrumentos
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          Asignaciones de partes, armonías vocales y estado de preparación del
          equipo.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="p-3 rounded-lg bg-destructive/15 border border-destructive/30 text-destructive text-sm"
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
                    className="py-1.5 px-4 text-[11px] font-bold uppercase tracking-wider text-primary"
                  >
                    Voces ({vocalRoles.length})
                  </TableCell>
                </TableRow>
              ) : null}
              {vocalRoles.map(renderRoleRow)}

              {/* Instrument section divider if instruments exist */}
              {instrumentRoles.length > 0 ? (
                <TableRow className="bg-secondary/20">
                  <TableCell
                    colSpan={isAdmin ? 5 : 4}
                    className="py-1.5 px-4 text-[11px] font-bold uppercase tracking-wider text-chord-accent"
                  >
                    Instrumentos ({instrumentRoles.length})
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
        <Card variant="bordered" className="p-5 space-y-4">
          <CardHeader className="p-0 pb-1">
            <CardTitle
              as="h3"
              className="text-sm font-semibold text-foreground uppercase tracking-wider"
            >
              Asignar Parte a Integrante
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Asigna a un miembro de alabanza una voz o instrumento para esta
              canción.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            <form onSubmit={assign} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="assign-member"
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    Miembro
                  </label>
                  <select
                    id="assign-member"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="w-full text-sm h-10 px-3 rounded-lg bg-secondary/80 border border-border text-foreground focus:border-primary focus:outline-hidden"
                  >
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.username}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="assign-role-type"
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                  >
                    Tipo de Parte
                  </label>
                  <select
                    id="assign-role-type"
                    value={roleType}
                    onChange={(e) => setRoleType(e.target.value)}
                    className="w-full text-sm h-10 px-3 rounded-lg bg-secondary/80 border border-border text-foreground focus:border-primary focus:outline-hidden"
                  >
                    {ROLE_TYPES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r] ?? r}
                      </option>
                    ))}
                  </select>
                </div>

                {roleType === "INSTRUMENT" ? (
                  <div className="space-y-1.5">
                    <label
                      htmlFor="assign-instrument"
                      className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide"
                    >
                      Nombre de Instrumento
                    </label>
                    <input
                      id="assign-instrument"
                      value={instrumentName}
                      onChange={(e) => setInstrumentName(e.target.value)}
                      placeholder="Ej: Teclado, Batería, Bajo"
                      className="w-full text-sm h-10 px-3 rounded-lg bg-secondary/80 border border-border text-foreground focus:border-primary focus:outline-hidden"
                    />
                  </div>
                ) : null}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="gap-2 shadow-sm font-semibold"
                >
                  <span>+</span>
                  <span>Asignar Parte</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
