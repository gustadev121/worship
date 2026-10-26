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
];

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
        placeholder="Search title or artist"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <fieldset>
        <legend>Labels</legend>
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
        Practice key
        <input
          name="practiceKey"
          placeholder="e.g. G major"
          value={practiceKey}
          onChange={(e) => setPracticeKey(e.target.value)}
        />
      </label>
      <label>
        Role type
        <select value={roleType} onChange={(e) => setRoleType(e.target.value)}>
          <option value="">Any</option>
          {ROLE_TYPES.map((r) => (
            <option key={r} value={r}>
              {r}
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
        My parts only
      </label>
      <button type="submit">Filter</button>
    </form>
  );
}
