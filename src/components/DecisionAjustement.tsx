"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DecisionAjustement({ id }: { id: number }) {
  const router = useRouter();
  const [commentaire, setCommentaire] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function decider(decision: "VALIDER" | "REFUSER") {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/ajustements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, commentaire }),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? `Erreur ${res.status}`);
      router.refresh();
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-1">
      <input
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Commentaire (obligatoire pour refuser)"
        className="w-full rounded border p-1 text-sm"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => decider("VALIDER")}
          className="rounded bg-green-700 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Valider
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => decider("REFUSER")}
          className="rounded bg-red-700 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}