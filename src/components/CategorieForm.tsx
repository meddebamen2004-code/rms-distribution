"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/styles";

export default function CategorieForm() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/categories", {
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
      <input name="nom" placeholder="Nouvelle catégorie" required className={`${inputCls} sm:w-64`} />
      <Button type="submit" variant="secondary">
        Ajouter
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}