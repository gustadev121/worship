"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export interface FilterLabel {
  id: string;
  name: string;
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

export function SongFilters({ labels }: { labels: FilterLabel[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [practiceKey, setPracticeKey] = useState(
    params.get("practiceKey") ?? "",
  );
  const [roleType, setRoleType] = useState(params.get("roleType") ?? "");
  const [selected, setSelected] = useState<string[]>(
    (params.get("labels") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0),
  );
  const [mine, setMine] = useState(params.get("mine") === "1");

  function apply() {
    const next = new URLSearchParams();
    if (q.trim()) {
      next.set("q", q.trim());
    }
    if (selected.length > 0) {
      next.set("labels", selected.join(","));
    }
    if (practiceKey) {
      next.set("practiceKey", practiceKey);
    }
    if (roleType) {
      next.set("roleType", roleType);
    }
    if (mine) {
      next.set("mine", "1");
    }
    const qs = next.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  function toggleLabel(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id],
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
    >
      <input
        type="search"
        name="q"
        placeholder="Buscar por título o artista"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <fieldset>
        <legend>Etiquetas</legend>
        {labels.map((label) => (
          <label key={label.id}>
            <input
              type="checkbox"
              checked={selected.includes(label.id)}
              onChange={() => toggleLabel(label.id)}
            />
            {label.name}
          </label>
        ))}
      </fieldset>
      <label>
        Tono de ensayo
        <input
          name="practiceKey"
          placeholder="p. ej. Sol mayor"
          value={practiceKey}
          onChange={(e) => setPracticeKey(e.target.value)}
        />
      </label>
      <label>
        Tipo de voz
        <select value={roleType} onChange={(e) => setRoleType(e.target.value)}>
          <option value="">Cualquiera</option>
          {ROLE_TYPES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r] ?? r}
            </option>
          ))}
        </select>
      </label>
      <label>
        <input
          type="checkbox"
          checked={mine}
          onChange={(e) => setMine(e.target.checked)}
        />
        Solo mis partes
      </label>
      <button type="submit">Filtrar</button>
    </form>
  );
}
