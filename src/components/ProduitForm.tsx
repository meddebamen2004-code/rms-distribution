"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { inputCls, labelCls } from "@/components/ui/styles";

type Categorie = { id: number; nom: string };

export default function ProduitForm({
  categories,
  onSuccess,
  onCancel,
}: {
  categories: Categorie[];
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
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
    onSuccess?.();
  }

  if (categories.length === 0) {
    return (
      <Alert tone="yellow" title="Aucune catégorie">
        Créez d’abord une catégorie dans la section « Catégories » de la page.
      </Alert>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {error && <Alert title="Enregistrement impossible">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Nom du produit *</label>
          <input name="nom" placeholder="Ex. Désinfectant surfaces" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Catégorie *</label>
          <select name="categorieId" required defaultValue="" className={inputCls}>
            <option value="" disabled>
              Sélectionner une catégorie
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Référence *</label>
          <input name="reference" placeholder="Ex. HYG-042" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Prix unitaire HT (€) *</label>
          <input name="prix" type="number" step="0.01" min="0" placeholder="0,00" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Nombre de pièces par carton *</label>
          <input name="piecesParCarton" type="number" min="1" placeholder="24" required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Seuil de stock minimum (pièces) *</label>
          <input name="seuilMin" type="number" min="0" defaultValue={0} required className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Date de péremption (facultatif)</label>
          <input name="datePeremption" type="date" className={inputCls} />
        </div>
      </div>
      <div className="flex justify-end gap-3 border-t border-slate-200 pt-5">
        <Button variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Patientez..." : "Enregistrer le produit"}
        </Button>
      </div>
    </form>
  );
}