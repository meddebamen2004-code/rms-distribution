"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { DecisionBadge } from "@/components/StatutBon";
import { inputCls } from "@/components/ui/styles";
import { formatQuantite } from "@/lib/format";

export type LigneControleData = {
  id: number;
  nom: string;
  reference: string;
  piecesParCarton: number;
  demandee: number;
  stock: number;
  decision: string;
  accordee: number | null;
  motif: string | null;
};

export default function LigneControle({ bonId, ligne }: { bonId: number; ligne: LigneControleData }) {
  const router = useRouter();
  const [qte, setQte] = useState(
    String(ligne.accordee && ligne.accordee > 0 ? ligne.accordee : ligne.demandee)
  );
  const [motif, setMotif] = useState(ligne.motif ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function decider(decision: "ACCEPTEE" | "REJETEE") {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/bons/${bonId}/lignes/${ligne.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        decision === "ACCEPTEE" ? { decision, quantiteAccordee: Number(qte), motif } : { decision, motif }
      ),
    });
    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? `Erreur ${res.status}`);
      return;
    }
    router.refresh();
  }

  const bordure =
    ligne.decision === "ACCEPTEE"
      ? "border-green-200"
      : ligne.decision === "REJETEE"
        ? "border-red-200"
        : "";

  return (
    <Card className={`p-4 ${bordure}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{ligne.nom}</p>
          <p className="text-xs text-slate-500">
            {ligne.reference} · {ligne.piecesParCarton} pièces / carton
          </p>
        </div>
        <DecisionBadge decision={ligne.decision} />
      </div>

      <p className="mt-3 text-sm text-slate-600">
        Demandé : <strong>{formatQuantite(ligne.demandee, ligne.piecesParCarton)}</strong> ({ligne.demandee} pièces) ·
        Stock dépôt :{" "}
        <strong className={ligne.demandee > ligne.stock ? "text-red-600" : ""}>
          {formatQuantite(ligne.stock, ligne.piecesParCarton)}
        </strong>
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-[10rem_1fr_auto]">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Quantité accordée (pièces)</label>
          <input
            type="number"
            min={1}
            max={ligne.demandee}
            value={qte}
            onChange={(e) => setQte(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Motif (obligatoire pour un rejet ou une quantité réduite)
          </label>
          <input value={motif} onChange={(e) => setMotif(e.target.value)} className={inputCls} />
        </div>
        <div className="flex items-end gap-2">
          <Button disabled={loading} onClick={() => decider("ACCEPTEE")}>
            Accepter
          </Button>
          <Button variant="danger" disabled={loading} onClick={() => decider("REJETEE")}>
            Rejeter
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </Card>
  );
}