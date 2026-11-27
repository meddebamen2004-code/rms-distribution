import { prisma } from "@/lib/prisma";
import { cartonsEtPieces, stockParProduit } from "@/lib/stock";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { tdCls, thCls } from "@/components/ui/styles";

const TYPES: Record<string, { label: string; tone: "green" | "blue" | "orange" | "gray" }> = {
  ENTREE_FOURNISSEUR: { label: "Entrée fournisseur", tone: "green" },
  AJUSTEMENT: { label: "Ajustement", tone: "blue" },
  CHARGEMENT: { label: "Chargement camion", tone: "orange" },
  DECHARGEMENT: { label: "Retour du camion", tone: "green" },
};

export default async function StockView() {
    const [produits, stock, mouvements] = await Promise.all([
    prisma.produit.findMany({ orderBy: { nom: "asc" } }),
    stockParProduit(),
    prisma.mouvementStock.findMany({
      where: { camionId: null },
      take: 50,
      orderBy: { creeLe: "desc" },
      include: { produit: true, auteur: true },
    }),
  ]);

  const visibles = produits.filter((p) => !p.archive || (stock.get(p.id) ?? 0) !== 0);

  return (
    <>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Stock du dépôt</h2>
          <p className="text-sm text-slate-500">Calculé à partir de tous les mouvements enregistrés.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Référence</th>
                <th className={thCls}>Produit</th>
                <th className={thCls}>Cartons</th>
                <th className={thCls}>Pièces</th>
                <th className={thCls}>Total (pièces)</th>
                <th className={thCls}>Seuil (pièces)</th>
                <th className={thCls}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibles.map((p) => {
                const total = stock.get(p.id) ?? 0;
                const { cartons, pieces } = cartonsEtPieces(total, p.piecesParCarton);
                const bas = total < p.seuilMin;
                return (
                  <tr key={p.id} className={bas ? "bg-red-50/60" : ""}>
                    <td className={tdCls}>
                      <span className="rounded-md bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                        {p.reference}
                      </span>
                    </td>
                    <td className={`${tdCls} font-semibold text-slate-900`}>
                      {p.nom} {p.archive && <em className="font-normal text-slate-500">(archivé)</em>}
                    </td>
                    <td className={tdCls}>{cartons}</td>
                    <td className={tdCls}>{pieces}</td>
                    <td className={`${tdCls} font-semibold`}>{total}</td>
                    <td className={tdCls}>{p.seuilMin}</td>
                    <td className={tdCls}>{bas && <Badge tone="red">Sous le seuil</Badge>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="mt-6 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Historique des mouvements</h2>
          <p className="text-sm text-slate-500">{mouvements.length} derniers mouvements.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Date et heure</th>
                <th className={thCls}>Produit</th>
                <th className={thCls}>Type</th>
                <th className={thCls}>Variation</th>
                <th className={thCls}>Réf.</th>
                <th className={thCls}>Auteur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {mouvements.map((m) => {
                const t = TYPES[m.type] ?? { label: m.type, tone: "gray" as const };
                return (
                  <tr key={m.id}>
                    <td className={tdCls}>{m.creeLe.toLocaleString("fr-FR")}</td>
                    <td className={`${tdCls} font-semibold text-slate-900`}>{m.produit.nom}</td>
                    <td className={tdCls}>
                      <Badge tone={t.tone}>{t.label}</Badge>
                    </td>
                    <td
                      className={`${tdCls} font-semibold ${
                        m.variationPieces >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {m.variationPieces > 0 ? "+" : ""}
                      {m.variationPieces}
                    </td>
                    <td className={tdCls}>{m.reference ?? "-"}</td>
                    <td className={tdCls}>{m.auteur.nom}</td>
                  </tr>
                );
              })}
              {mouvements.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    Aucun mouvement pour l’instant.
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