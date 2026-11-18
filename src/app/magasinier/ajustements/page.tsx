import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import { tdCls, thCls } from "@/components/ui/styles";
import AjustementForm from "@/components/AjustementForm";
import StatutAjustement from "@/components/StatutAjustement";

export default async function MagasinierAjustementsPage() {
  const user = await requireRole("MAGASINIER");

  const produits = await prisma.produit.findMany({ orderBy: { nom: "asc" } });
  const options = produits.map((p) => ({
    id: p.id,
    label: `${p.nom} (${p.reference})`,
    piecesParCarton: p.piecesParCarton,
  }));
  const demandes = await prisma.ajustementStock.findMany({
    where: { demandeParId: user.id },
    include: { produit: true },
    orderBy: { creeLe: "desc" },
    take: 30,
  });

  return (
    <>
      <PageHeader
        eyebrow="Dépôt"
        title="Ajustements de stock"
        subtitle="Proposez une correction : le gérant la valide ou la refuse."
      />

      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Nouvelle demande de correction</h2>
        <AjustementForm produits={options} />
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Mes demandes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Date</th>
                <th className={thCls}>Produit</th>
                <th className={thCls}>Variation</th>
                <th className={thCls}>Motif</th>
                <th className={thCls}>Statut</th>
                <th className={thCls}>Commentaire du gérant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {demandes.map((d) => (
                <tr key={d.id}>
                  <td className={tdCls}>{d.creeLe.toLocaleString("fr-FR")}</td>
                  <td className={`${tdCls} font-semibold text-slate-900`}>{d.produit.nom}</td>
                  <td
                    className={`${tdCls} font-semibold ${
                      d.variationPieces >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {d.variationPieces > 0 ? "+" : ""}
                    {d.variationPieces}
                  </td>
                  <td className={tdCls}>{d.motif}</td>
                  <td className={tdCls}>
                    <StatutAjustement statut={d.statut} />
                  </td>
                  <td className={tdCls}>{d.commentaireGerant ?? "-"}</td>
                </tr>
              ))}
              {demandes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Aucune demande pour l’instant.
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