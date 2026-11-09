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
  FIRST_VOICE: "Primera voz",
  SECOND_VOICE: "Segunda voz",
  THIRD_VOICE: "Tercera voz",
  BACKING_VOCAL: "Coro",
  INSTRUMENT: "Instrumento",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PRACTICING: "Ensayando",
  READY: "Lista",
};

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
  const [error, setError] = useState<string | null>(null);

  const nameById = new Map(members.map((m) => [m.id, m.username]));

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al asignar");
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
    try {
      await post(`/api/songs/${songId}/roles/${roleId}`, "PATCH", {
        harmonyOrPartNotes: notes[roleId] ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    }
  }

  return (
    <section>
      <h2>Voces y partes</h2>
      {error ? <p role="alert">{error}</p> : null}
      <table>
        <thead>
          <tr>
            <th>Miembro</th>
            <th>Voz</th>
            <th>Instrumento</th>
            <th>Estado</th>
            {isAdmin ? <th>Notas</th> : null}
            {isAdmin ? <th>Acciones</th> : null}
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>{nameById.get(r.userId) ?? r.userId}</td>
              <td>{ROLE_LABELS[r.roleType] ?? r.roleType}</td>
              <td>{r.instrumentName ?? "—"}</td>
              <td>{STATUS_LABELS[r.practiceStatus] ?? r.practiceStatus}</td>
              {isAdmin ? (
                <td>
                  <input
                    defaultValue={r.harmonyOrPartNotes ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    aria-label={`Notas para ${nameById.get(r.userId) ?? r.userId}`}
                  />
                  <button type="button" onClick={() => saveNotes(r.id)}>
                    Guardar
                  </button>
                </td>
              ) : null}
              {isAdmin ? (
                <td>
                  <button type="button" onClick={() => remove(r.id)}>
                    Eliminar
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {isAdmin ? (
        <form onSubmit={assign}>
          <h3>Asignar voz</h3>
          <label>
            Miembro
            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                </option>
              ))}
            </select>
          </label>
          <label>
            Voz
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
            >
              {ROLE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </select>
          </label>
          {roleType === "INSTRUMENT" ? (
            <label>
              Instrumento
              <input
                value={instrumentName}
                onChange={(e) => setInstrumentName(e.target.value)}
                placeholder="Teclado"
              />
            </label>
          ) : null}
          <button type="submit">Asignar</button>
        </form>
      ) : null}
    </section>
  );
}
