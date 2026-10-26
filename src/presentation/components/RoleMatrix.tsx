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
];

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
  const [roleType, setRoleType] = useState(ROLE_TYPES[0] ?? "FIRST_VOICE");
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
      throw new Error(data?.error ?? "Request failed");
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
      setError(err instanceof Error ? err.message : "Assign failed");
    }
  }

  async function remove(roleId: string) {
    setError(null);
    try {
      await post(`/api/songs/${songId}/roles/${roleId}`, "DELETE");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function saveNotes(roleId: string) {
    setError(null);
    try {
      await post(`/api/songs/${songId}/roles/${roleId}`, "PATCH", {
        harmonyOrPartNotes: notes[roleId] ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <section>
      <h2>Roles</h2>
      {error ? <p role="alert">{error}</p> : null}
      <table>
        <thead>
          <tr>
            <th>Member</th>
            <th>Role</th>
            <th>Instrument</th>
            <th>Status</th>
            {isAdmin ? <th>Notes</th> : null}
            {isAdmin ? <th>Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id}>
              <td>{nameById.get(r.userId) ?? r.userId}</td>
              <td>{r.roleType}</td>
              <td>{r.instrumentName ?? "—"}</td>
              <td>{r.practiceStatus}</td>
              {isAdmin ? (
                <td>
                  <input
                    defaultValue={r.harmonyOrPartNotes ?? ""}
                    onChange={(e) =>
                      setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))
                    }
                    aria-label={`Notes for ${nameById.get(r.userId) ?? r.userId}`}
                  />
                  <button type="button" onClick={() => saveNotes(r.id)}>
                    Save
                  </button>
                </td>
              ) : null}
              {isAdmin ? (
                <td>
                  <button type="button" onClick={() => remove(r.id)}>
                    Delete
                  </button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
      {isAdmin ? (
        <form onSubmit={assign}>
          <h3>Assign role</h3>
          <label>
            Member
            <select value={userId} onChange={(e) => setUserId(e.target.value)}>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.username}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select
              value={roleType}
              onChange={(e) => setRoleType(e.target.value)}
            >
              {ROLE_TYPES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          {roleType === "INSTRUMENT" ? (
            <label>
              Instrument
              <input
                value={instrumentName}
                onChange={(e) => setInstrumentName(e.target.value)}
                placeholder="Keys"
              />
            </label>
          ) : null}
          <button type="submit">Assign</button>
        </form>
      ) : null}
    </section>
  );
}
