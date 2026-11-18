"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/styles";

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
      <input name="nom" placeholder="Secteur (cité, quartier)" required className={`${inputCls} sm:w-64`} />
      <input name="ville" placeholder="Ville" required className={`${inputCls} sm:w-48`} />
      <Button type="submit" variant="secondary">
        Ajouter
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}