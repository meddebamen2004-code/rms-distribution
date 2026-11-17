"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ArchiveButton({ id, archive }: { id: number; archive: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/produits/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archive: !archive }),
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
    <span>
      <button
        type="button"
        onClick={toggle}
        disabled={loading}
        className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
      >
        {archive ? "Restaurer" : "Archiver"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}