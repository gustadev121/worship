"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const STATUSES = ["PENDING", "PRACTICING", "READY"];

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
      setError(data?.error ?? "Update failed");
      return;
    }
    setStatus(next);
    router.refresh();
  }

  return (
    <div>
      <label>
        Practice status
        <select
          value={status}
          disabled={saving}
          onChange={(e) => change(e.target.value)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
