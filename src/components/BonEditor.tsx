"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { formatQuantite } from "@/lib/format";

export type OptionProduit = {
  id: number;
  nom: string;
  reference: string;
  piecesParCarton: number;
  stock: number;
};
type Retour = { decision: string; motif: string | null };

function Stepper({
  label,
  value,
  onMinus,
  onPlus,
  minusDisabled,
  plusDisabled,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
  minusDisabled: boolean;
  plusDisabled: boolean;
}) {
  const btn =
    "flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onMinus} disabled={minusDisabled} aria-label={`Retirer des ${label.toLowerCase()}`} className={btn}>
          <Minus size={20} />
        </button>
        <span className="w-10 text-center text-xl font-semibold text-slate-900">{value}</span>
        <button type="button" onClick={onPlus} disabled={plusDisabled} aria-label={`Ajouter des ${label.toLowerCase()}`} className={btn}>
          <Plus size={20} />
        </button>
      </div>
    </div>
  );
}

export default function BonEditor({
  jour,
  bonId,
  produits,
  initial,
  retours,
}: {
  jour: string;
  bonId: number | null;
  produits: OptionProduit[];
  initial: Record<number, number>;
  retours: Record<number, Retour>;
}) {
  const router = useRouter();
  const [qte, setQte] = useState<Record<number, number>>(initial);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function changer(p: OptionProduit, delta: number) {
    setMessage("");
    setQte((q) => {
      const cur = q[p.id] ?? 0;
      const next = cur + delta;
      if (next < 0 || (delta > 0 && next > p.stock)) return q;
      return { ...q, [p.id]: next };
    });
  }

  const choisis = produits.filter((p) => (qte[p.id] ?? 0) > 0);
  const totalPieces = choisis.reduce((s, p) => s + (qte[p.id] ?? 0), 0);

  async function envoyer(envoyer: boolean) {
    setError("");
    setMessage("");
    if (choisis.length === 0) {
      setError("Choisissez au moins un produit.");
      return;
    }
    const lignes = choisis.map((p) => {
      const t = qte[p.id] ?? 0;
      return { produitId: p.id, cartons: Math.floor(t / p.piecesParCarton), pieces: t % p.piecesParCarton };
    });
    setLoading(true);
    const res = await fetch(bonId ? `/api/bons/${bonId}` : "/api/bons", {
      method: bonId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bonId ? { lignes, envoyer } : { jour, lignes, envoyer }),
    });
    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue");
      return;
    }
    setMessage(envoyer ? "Demande envoyée au magasinier." : "Brouillon enregistré.");
    router.refresh();
  }

  if (produits.length === 0) {
    return (
      <Alert tone="yellow" title="Aucun produit disponible">
        Le dépôt n’a aucun produit en stock pour le moment.
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert title="Demande impossible">{error}</Alert>}
      {message && <Alert tone="blue" title={message} />}

      {produits.map((p) => {
        const t = qte[p.id] ?? 0;
        const cartons = Math.floor(t / p.piecesParCarton);
        const pieces = t % p.piecesParCarton;
        const retour = retours[p.id];
        return (
          <Card key={p.id} className={`p-4 ${t > 0 ? "border-blue-200" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{p.nom}</p>
                <p className="text-xs text-slate-500">
                  {p.reference} · {p.piecesParCarton} pièces / carton
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                Stock dépôt
                <span className="block text-sm font-semibold text-slate-700">
                  {formatQuantite(p.stock, p.piecesParCarton)}
                </span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stepper
                label="Cartons"
                value={cartons}
                onMinus={() => changer(p, -p.piecesParCarton)}
                onPlus={() => changer(p, p.piecesParCarton)}
                minusDisabled={t < p.piecesParCarton}
                plusDisabled={t + p.piecesParCarton > p.stock}
              />
              <Stepper
                label="Pièces"
                value={pieces}
                onMinus={() => changer(p, -1)}
                onPlus={() => changer(p, 1)}
                minusDisabled={t < 1}
                plusDisabled={t + 1 > p.stock}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">= {t} pièces</p>
            {t > p.stock && (
              <p className="mt-1 text-sm text-red-600">Supérieur au stock actuel : réduisez la quantité.</p>
            )}
            {retour?.decision === "REJETEE" && (
              <p className="mt-1 text-sm text-red-600">Rejeté par le magasinier : {retour.motif}</p>
            )}
          </Card>
        );
      })}

      <Card className="sticky bottom-4 p-4 shadow-lg">
        <p className="text-sm text-slate-600">
          {choisis.length} produit{choisis.length > 1 ? "s" : ""} · {totalPieces} pièces au total
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" disabled={loading} onClick={() => envoyer(false)} className="sm:flex-1">
            Enregistrer le brouillon
          </Button>
          <Button disabled={loading} onClick={() => envoyer(true)} className="sm:flex-1">
            {loading ? "Patientez..." : "Envoyer la demande"}
          </Button>
        </div>
      </Card>
    </div>
  );
}