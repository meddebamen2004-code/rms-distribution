"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Produit = { id: number; label: string; piecesParCarton: number };
type Ligne = { produitId: string; cartons: string; pieces: string };

const vide: Ligne = { produitId: "", cartons: "", pieces: "" };

export default function ReceptionForm({ produits }: { produits: Produit[] }) {
  const router = useRouter();
  const [reference, setReference] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([{ ...vide }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function maj(i: number, champ: keyof Ligne, valeur: string) {
    setLignes((ls) => ls.map((l, idx) => (idx === i ? { ...l, [champ]: valeur } : l)));
  }

  function total(l: Ligne) {
    const p = produits.find((p) => String(p.id) === l.produitId);
    if (!p) return 0;
    return (Number(l.cartons) || 0) * p.piecesParCarton + (Number(l.pieces) || 0);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/receptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, lignes }),
    });
    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue");
      return;
    }
    setReference("");
    setLignes([{ ...vide }]);
    router.refresh();
  }

  const cls = "rounded border p-2";
  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-3">
      <input
        value={reference}
        onChange={(e) => setReference(e.target.value)}
        placeholder="N° du bon fournisseur (facultatif)"
        className={`${cls} w-full`}
      />
      {lignes.map((l, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            value={l.produitId}
            onChange={(e) => maj(i, "produitId", e.target.value)}
            required
            className={cls}
          >
            <option value="" disabled>
              Produit
            </option>
            {produits.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            value={l.cartons}
            onChange={(e) => maj(i, "cartons", e.target.value)}
            placeholder="Cartons"
            className={`${cls} w-28`}
          />
          <input
            type="number"
            min={0}
            value={l.pieces}
            onChange={(e) => maj(i, "pieces", e.target.value)}
            placeholder="Pièces"
            className={`${cls} w-28`}
          />
          <span className="text-sm text-gray-600">= {total(l)} pièces</span>
          {lignes.length > 1 && (
            <button
              type="button"
              onClick={() => setLignes((ls) => ls.filter((_, idx) => idx !== i))}
              className="text-sm text-red-600 underline"
            >
              Retirer
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setLignes((ls) => [...ls, { ...vide }])}
        className="text-sm text-blue-700 underline"
      >
        + Ajouter un produit
      </button>
      {error && <p className="text-red-600">{error}</p>}
      <button
        disabled={loading}
        className="block rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "Patientez..." : "Enregistrer la réception"}
      </button>
    </form>
  );
}