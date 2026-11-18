import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { stockParProduit } from "@/lib/stock";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { tdCls, thCls } from "@/components/ui/styles";
import DecisionAjustement from "@/components/DecisionAjustement";
import StatutAjustement from "@/components/StatutAjustement";

export default async function GerantAjustementsPage() {
  await requireRole("GERANT");

  const [enAttente, traites, stock] = await Promise.all([
    prisma.ajustementStock.findMany({
      where: { statut: "EN_ATTENTE" },
      include: { produit: true, demandePar: true },
      orderBy: { creeLe: "asc" },
    }),
    prisma.ajustementStock.findMany({
      where: { statut: { not: "EN_ATTENTE" } },
      include: { produit: true, demandePar: true, decidePar: true },
      orderBy: { decideLe: "desc" },
      take: 30,
    }),
    stockParProduit(),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Dépôt"
        title="Ajustements de stock"
        subtitle="Validez ou refusez les corrections proposées par le magasinier."
      />

      <Card className="mb-6 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">À valider ({enAttente.length})</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Date</th>
                <th className={thCls}>Demandé par</th>
                <th className={thCls}>Produit</th>
                <th className={thCls}>Stock actuel</th>
                <th className={thCls}>Variation</th>
                <th className={thCls}>Motif</th>
                <th className={thCls}>Décision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {enAttente.map((a) => (
                <tr key={a.id} className="align-top">
                  <td className={tdCls}>{a.creeLe.toLocaleString("fr-FR")}</td>
                  <td className={tdCls}>{a.demandePar.nom}</td>
                  <td className={`${tdCls} font-semibold text-slate-900`}>{a.produit.nom}</td>
                  <td className={tdCls}>{stock.get(a.produitId) ?? 0}</td>
                  <td
                    className={`${tdCls} font-semibold ${
                      a.variationPieces >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {a.variationPieces > 0 ? "+" : ""}
                    {a.variationPieces}
                  </td>
                  <td className={tdCls}>{a.motif}</td>
                  <td className={tdCls}>
                    <DecisionAjustement id={a.id} />
                  </td>
                </tr>
              ))}
              {enAttente.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Aucune demande en attente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Historique des décisions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Décidé le</th>
                <th className={thCls}>Produit</th>
                <th className={thCls}>Variation</th>
                <th className={thCls}>Demandé par</th>
                <th className={thCls}>Décidé par</th>
                <th className={thCls}>Statut</th>
                <th className={thCls}>Commentaire</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {traites.map((a) => (
                <tr key={a.id}>
                  <td className={tdCls}>{a.decideLe?.toLocaleString("fr-FR") ?? "-"}</td>
                  <td className={`${tdCls} font-semibold text-slate-900`}>{a.produit.nom}</td>
                  <td className={tdCls}>
                    {a.variationPieces > 0 ? "+" : ""}
                    {a.variationPieces}
                  </td>
                  <td className={tdCls}>{a.demandePar.nom}</td>
                  <td className={tdCls}>{a.decidePar?.nom ?? "-"}</td>
                  <td className={tdCls}>
                    <StatutAjustement statut={a.statut} />
                  </td>
                  <td className={tdCls}>{a.commentaireGerant ?? "-"}</td>
                </tr>
              ))}
              {traites.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    Aucune décision pour l’instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}