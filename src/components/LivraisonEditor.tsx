"use client";
import { useState, type Dispatch, type SetStateAction } from "react";
import { useRouter } from "next/navigation";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Stepper from "@/components/ui/Stepper";
import { inputCls } from "@/components/ui/styles";
import { formatQuantite, MOTIFS_RETOUR } from "@/lib/format";

export type ProduitCamion = {
  id: number;
  nom: string;
  reference: string;
  piecesParCarton: number;
  stock: number;
};
type Compteurs = Record<number, number>;

const MAX_RETOUR = 99999;

function bump(setter: Dispatch<SetStateAction<Compteurs>>, id: number, delta: number, max: number) {
  setter((q) => {
    const next = (q[id] ?? 0) + delta;
    if (next < 0 || next > max) return q;
    return { ...q, [id]: next };
  });
}

export default function LivraisonEditor({
  clientId,
  produits,
}: {
  clientId: number;
  produits: ProduitCamion[];
}) {
  const router = useRouter();
  const [livre, setLivre] = useState<Compteurs>({});
  const [retour, setRetour] = useState<Compteurs>({});
  const [motif, setMotif] = useState<Record<number, string>>({});
  const [retourOuvert, setRetourOuvert] = useState<Record<number, boolean>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const totalLivre = produits.reduce((s, p) => s + (livre[p.id] ?? 0), 0);
  const totalRetour = produits.reduce((s, p) => s + (retour[p.id] ?? 0), 0);
  const nbProduits = produits.filter((p) => (livre[p.id] ?? 0) + (retour[p.id] ?? 0) > 0).length;

  async function valider() {
    setError("");
    const lignes = produits
      .map((p) => {
        const r = retour[p.id] ?? 0;
        return {
          produitId: p.id,
          quantiteLivree: livre[p.id] ?? 0,
          quantiteRetour: r,
          motifRetour: r > 0 ? motif[p.id] || null : null,
        };
      })
      .filter((l) => l.quantiteLivree + l.quantiteRetour > 0);

    if (lignes.length === 0) {
      setError("Saisissez au moins une quantité livrée ou retournée.");
      return;
    }
    const sansMotif = lignes.find((l) => l.quantiteRetour > 0 && !l.motifRetour);
    if (sansMotif) {
      const p = produits.find((x) => x.id === sansMotif.produitId);
      setError(`Choisissez un motif de retour pour « ${p?.nom} ».`);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/livraisons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, lignes }),
    });
    setLoading(false);
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error ?? "Une erreur est survenue");
      return;
    }
    router.push("/livreur/livraisons");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && <Alert title="Livraison impossible">{error}</Alert>}

      {produits.map((p) => {
        const ppc = p.piecesParCarton;
        const l = livre[p.id] ?? 0;
        const r = retour[p.id] ?? 0;
        const ouvert = retourOuvert[p.id] || r > 0;
        return (
          <Card key={p.id} className={`p-4 ${l + r > 0 ? "border-blue-200" : ""}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">{p.nom}</p>
                <p className="text-xs text-slate-500">
                  {p.reference} · {ppc} pièces / carton
                </p>
              </div>
              <div className="text-right text-xs text-slate-500">
                Dans le camion
                <span className="block text-sm font-semibold text-slate-700">{formatQuantite(p.stock, ppc)}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <Stepper
                label="Cartons"
                value={Math.floor(l / ppc)}
                onMinus={() => bump(setLivre, p.id, -ppc, p.stock)}
                onPlus={() => bump(setLivre, p.id, ppc, p.stock)}
                minusDisabled={l < ppc}
                plusDisabled={l + ppc > p.stock}
              />
              <Stepper
                label="Pièces"
                value={l % ppc}
                onMinus={() => bump(setLivre, p.id, -1, p.stock)}
                onPlus={() => bump(setLivre, p.id, 1, p.stock)}
                minusDisabled={l < 1}
                plusDisabled={l + 1 > p.stock}
              />
            </div>
            <p className="mt-3 text-sm text-slate-600">= {l} pièces livrées</p>

            {ouvert ? (
              <div className="mt-4 space-y-3 rounded-xl bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">Retour de marchandise</p>
                <div className="grid grid-cols-2 gap-4">
                  <Stepper
                    label="Cartons"
                    value={Math.floor(r / ppc)}
                    onMinus={() => bump(setRetour, p.id, -ppc, MAX_RETOUR)}
                    onPlus={() => bump(setRetour, p.id, ppc, MAX_RETOUR)}
                    minusDisabled={r < ppc}
                    plusDisabled={false}
                  />
                  <Stepper
                    label="Pièces"
                    value={r % ppc}
                    onMinus={() => bump(setRetour, p.id, -1, MAX_RETOUR)}
                    onPlus={() => bump(setRetour, p.id, 1, MAX_RETOUR)}
                    minusDisabled={r < 1}
                    plusDisabled={false}
                  />
                </div>
                <p className="text-sm text-slate-600">= {r} pièces retournées</p>
                <select
                  value={motif[p.id] ?? ""}
                  onChange={(e) => setMotif((m) => ({ ...m, [p.id]: e.target.value }))}
                  className={inputCls}
                >
                  <option value="" disabled>
                    Motif du retour
                  </option>
                  {Object.entries(MOTIFS_RETOUR).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setRetourOuvert((o) => ({ ...o, [p.id]: true }))}
                className="mt-4 text-sm font-semibold text-blue-600"
              >
                + Ajouter un retour
              </button>
            )}
          </Card>
        );
      })}

      <Card className="sticky bottom-4 p-4 shadow-lg">
        <p className="text-sm text-slate-600">
          {nbProduits} produit{nbProduits > 1 ? "s" : ""} · {totalLivre} pièces livrées
          {totalRetour > 0 && ` · ${totalRetour} retournées`}
        </p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" disabled={loading} onClick={() => router.push("/livreur/livraisons")} className="sm:flex-1">
            Annuler
          </Button>
          <Button disabled={loading} onClick={valider} className="sm:flex-1">
            {loading ? "Patientez..." : "Valider la livraison"}
          </Button>
        </div>
      </Card>
    </div>
  );
}