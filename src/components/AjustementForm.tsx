"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import { inputCls } from "@/components/ui/styles";

type Produit = { id: number; label: string; piecesParCarton: number };

export default function AjustementForm({ produits }: { produits: Produit[] }) {
  const router = useRouter();
  const [produitId, setProduitId] = useState("");
  const [sens, setSens] = useState("RETRAIT");
  const [cartons, setCartons] = useState("");
  const [pieces, setPieces] = useState("");
  const [motif, setMotif] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const produit = produits.find((p) => String(p.id) === produitId);
  const total = produit
    ? (Number(cartons) || 0) * produit.piecesParCarton + (Number(pieces) || 0)
    : 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/ajustements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ produitId, sens, cartons, pieces, motif }),
    });
    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue");
      return;
    }
    setProduitId("");
    setCartons("");
    setPieces("");
    setMotif("");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <Alert title="Demande impossible">{error}</Alert>}
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
          required
          className={`${inputCls} sm:w-72`}
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
        <select value={sens} onChange={(e) => setSens(e.target.value)} className={`${inputCls} sm:w-48`}>
          <option value="RETRAIT">Retirer du stock</option>
          <option value="AJOUT">Ajouter au stock</option>
        </select>
        <input
          type="number"
          min={0}
          value={cartons}
          onChange={(e) => setCartons(e.target.value)}
          placeholder="Cartons"
          className={`${inputCls} sm:w-28`}
        />
        <input
          type="number"
          min={0}
          value={pieces}
          onChange={(e) => setPieces(e.target.value)}
          placeholder="Pièces"
          className={`${inputCls} sm:w-28`}
        />
        <span className="text-sm text-slate-500">= {total} pièces</span>
      </div>
      <textarea
        value={motif}
        onChange={(e) => setMotif(e.target.value)}
        placeholder="Motif (obligatoire) : casse, erreur de saisie, inventaire..."
        required
        rows={2}
        className={inputCls}
      />
      <Button type="submit" disabled={loading}>
        {loading ? "Patientez..." : "Envoyer au gérant"}
      </Button>
    </form>
  );
}