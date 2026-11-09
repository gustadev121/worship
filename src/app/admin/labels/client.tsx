"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface AdminLabel {
  id: string;
  name: string;
  slug: string;
  colorHex: string;
}

export function LabelAdmin({ initial }: { initial: AdminLabel[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [colorHex, setColorHex] = useState("#4F46E5");
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, colorHex }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Error al crear");
      return;
    }
    setName("");
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/labels/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as {
        error?: string;
      } | null;
      setError(data?.error ?? "Error al eliminar");
      return;
    }
    router.refresh();
  }

  return (
    <div>
      {error ? <p role="alert">{error}</p> : null}
      <table>
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Slug</th>
            <th>Color</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {initial.map((l) => (
            <tr key={l.id}>
              <td>{l.name}</td>
              <td>{l.slug}</td>
              <td>{l.colorHex}</td>
              <td>
                <button type="button" onClick={() => remove(l.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <form onSubmit={create}>
        <h2>Crear etiqueta</h2>
        <label>
          Nombre
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label>
          Color
          <input
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            required
          />
        </label>
        <button type="submit">Crear</button>
      </form>
    </div>
  );
}
