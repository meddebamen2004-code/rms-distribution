import Card from "@/components/ui/Card";
import { tdCls, thCls } from "@/components/ui/styles";
import StatutBon, { DecisionBadge } from "@/components/StatutBon";
import { formatQuantite } from "@/lib/format";
import { labelJour } from "@/lib/dates";
import type { BonAvecDetails } from "@/lib/bons";

function Fait({ label, valeur }: { label: string; valeur: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-slate-900">{valeur}</p>
    </div>
  );
}

export default function BonDetail({ bon }: { bon: BonAvecDetails }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-4 border-b border-slate-200 px-6 py-4 sm:grid-cols-4">
        <Fait label="Livreur" valeur={bon.livreur.nom} />
        <Fait label="Tournée du" valeur={labelJour(bon.jour)} />
        <Fait label="Contrôlé par" valeur={bon.controlePar?.nom ?? "-"} />
        <Fait label="Validé par" valeur={bon.validePar?.nom ?? "-"} />
      </div>
      <div className="flex items-center gap-2 px-6 pt-4">
        <span className="text-sm text-slate-500">Statut :</span>
        <StatutBon statut={bon.statut} />
      </div>
      <div className="overflow-x-auto pt-2">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Produit</th>
              <th className={thCls}>Demandé</th>
              <th className={thCls}>Accordé</th>
              <th className={thCls}>Décision</th>
              <th className={thCls}>Motif</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bon.lignes.map((l) => {
              const ppc = l.produit.piecesParCarton;
              return (
                <tr key={l.id}>
                  <td className={`${tdCls} font-semibold text-slate-900`}>
                    {l.produit.nom}
                    <span className="block text-xs font-normal text-slate-500">{l.produit.reference}</span>
                  </td>
                  <td className={tdCls}>{formatQuantite(l.quantiteDemandee, ppc)}</td>
                  <td className={tdCls}>
                    {l.decision === "EN_ATTENTE" ? "-" : formatQuantite(l.quantiteAccordee ?? 0, ppc)}
                  </td>
                  <td className={tdCls}>
                    <DecisionBadge decision={l.decision} />
                  </td>
                  <td className={tdCls}>{l.motif ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}