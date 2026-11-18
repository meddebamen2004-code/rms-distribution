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
    }
    router.refresh();
  }

  return (
    <div className="min-w-56 space-y-2">
      <input
        value={commentaire}
        onChange={(e) => setCommentaire(e.target.value)}
        placeholder="Commentaire (obligatoire pour refuser)"
        className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => decider("VALIDER")}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
        >
          Valider
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => decider("REFUSER")}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          Refuser
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}