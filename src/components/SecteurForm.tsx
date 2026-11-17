"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SecteurForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/secteurs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue");
      return;
    }
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input name="nom" placeholder="Secteur (cité, quartier)" required className="rounded border p-2" />
      <input name="ville" placeholder="Ville" required className="rounded border p-2" />
      <button className="rounded bg-gray-800 px-3 py-2 text-white">Ajouter</button>
      {error && <p className="text-red-600">{error}</p>}
    </form>
  );
}