"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Secteur = { id: number; label: string };

export default function PlanningCell({
  livreurId,
  jour,
  secteurId,
  secteurs,
}: {
  livreurId: number;
  jour: string;
  secteurId: number | null;
  secteurs: Secteur[];
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setError("");
    setLoading(true);
    const res = await fetch("/api/affectations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ livreurId, jour, secteurId: Number(e.target.value) }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? `Erreur ${res.status}`);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <select
        value={secteurId ?? ""}
        onChange={onChange}
        disabled={loading}
        className={
          secteurId
            ? "w-full rounded border p-1 text-sm"
            : "w-full rounded border border-orange-400 p-1 text-sm text-orange-600"
        }
      >
        <option value="" disabled>
          Non affecté
        </option>
        {secteurs.map((s) => (
          <option key={s.id} value={s.id}>
            {s.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}