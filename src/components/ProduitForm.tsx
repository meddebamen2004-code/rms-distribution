"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Categorie = { id: number; nom: string };

export default function ProduitForm({ categories }: { categories: Categorie[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    setLoading(true);
    const data = Object.fromEntries(new FormData(form));
    const res = await fetch("/api/produits", {
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
    form.reset();
    router.refresh();
  }

  if (categories.length === 0) {
    return <p className="text-orange-600">Créez d'abord une catégorie.</p>;
  }

  const cls = "rounded border p-2";
  return (
    <form onSubmit={onSubmit} className="grid max-w-2xl gap-3 sm:grid-cols-2">
      <input name="reference" placeholder="Référence" required className={cls} />
      <input name="nom" placeholder="Nom du produit" required className={cls} />
      <select name="categorieId" required className={cls} defaultValue="">
        <option value="" disabled>
          Catégorie
        </option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.nom}
          </option>
        ))}
      </select>
      <input name="prix" type="number" step="0.01" placeholder="Prix" required className={cls} />
      <input
        name="piecesParCarton"
        type="number"
        placeholder="Pièces par carton"
        required
        className={cls}
      />
      <input name="seuilMin" type="number" placeholder="Seuil minimum" defaultValue={0} className={cls} />
      <label className="flex flex-col text-sm text-gray-600 sm:col-span-2">
        Date de péremption (facultatif)
        <input name="datePeremption" type="date" className={cls} />
      </label>
      {error && <p className="text-red-600 sm:col-span-2">{error}</p>}
      <button
        disabled={loading}
        className="rounded bg-blue-700 p-2 text-white disabled:opacity-50 sm:col-span-2"
      >
        {loading ? "Patientez..." : "Ajouter le produit"}
      </button>
    </form>
  );
}