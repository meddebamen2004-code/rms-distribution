"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_BY_ROLE, type Role } from "@/lib/roles";

export default function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    setLoading(false);

    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue");
      return;
    }
    router.push(HOME_BY_ROLE[json.role as Role]);
    router.refresh();
  }

  const cls = "w-full rounded border p-2";
  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-sm flex-col gap-3">
      <input name="identifiant" placeholder="Identifiant" required className={cls} />
      <input
        name="motDePasse"
        type="password"
        placeholder="Mot de passe"
        required
        className={cls}
      />
      {error && <p className="text-red-600">{error}</p>}
      <button
        disabled={loading}
        className="rounded bg-blue-700 p-2 text-white disabled:opacity-50"
      >
        {loading ? "Patientez..." : "Se connecter"}
      </button>
    </form>
  );
}