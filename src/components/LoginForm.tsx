"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { HOME_BY_ROLE, type Role } from "@/lib/roles";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { inputCls, labelCls } from "@/components/ui/styles";

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

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <Alert title="Connexion impossible">{error}</Alert>}
      <div>
        <label htmlFor="identifiant" className={labelCls}>
          Identifiant
        </label>
        <input
          id="identifiant"
          name="identifiant"
          placeholder="prenom.nom"
          autoComplete="username"
          required
          className={inputCls}
        />
      </div>
      <div>
        <label htmlFor="motDePasse" className={labelCls}>
          Mot de passe
        </label>
        <input
          id="motDePasse"
          name="motDePasse"
          type="password"
          placeholder="Votre mot de passe"
          autoComplete="current-password"
          required
          className={inputCls}
        />
      </div>
      <Button type="submit" disabled={loading} className="w-full py-3">
        {loading ? "Patientez..." : "Se connecter"}
      </Button>
    </form>
  );
}
