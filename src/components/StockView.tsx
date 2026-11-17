import { prisma } from "@/lib/prisma";
import { cartonsEtPieces, stockParProduit } from "@/lib/stock";

const TYPES: Record<string, string> = {
  ENTREE_FOURNISSEUR: "Entrée fournisseur",
  AJUSTEMENT: "Ajustement",
};

export default async function StockView() {
  const [produits, stock, mouvements] = await Promise.all([
    prisma.produit.findMany({ orderBy: { nom: "asc" } }),
    stockParProduit(),
    prisma.mouvementStock.findMany({
      take: 50,
      orderBy: { creeLe: "desc" },
      include: { produit: true, auteur: true },
    }),
  ]);

  const visibles = produits.filter((p) => !p.archive || (stock.get(p.id) ?? 0) !== 0);

  return (
    <>
      <section className="space-y-2">
        <h2 className="font-semibold">Stock du dépôt</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Référence</th>
                <th className="p-2">Produit</th>
                <th className="p-2">Cartons</th>
                <th className="p-2">Pièces</th>
                <th className="p-2">Total (pièces)</th>
                <th className="p-2">Seuil (pièces)</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => {
                const total = stock.get(p.id) ?? 0;
                const { cartons, pieces } = cartonsEtPieces(total, p.piecesParCarton);
                const bas = total < p.seuilMin;
                return (
                  <tr key={p.id} className={bas ? "border-b bg-red-50" : "border-b"}>
                    <td className="p-2">{p.reference}</td>
                    <td className="p-2">
                      {p.nom} {p.archive && <em className="text-gray-400">(archivé)</em>}
                    </td>
                    <td className="p-2">{cartons}</td>
                    <td className="p-2">{pieces}</td>
                    <td className="p-2">{total}</td>
                    <td className="p-2">{p.seuilMin}</td>
                    <td className="p-2">
                      {bas && <span className="rounded bg-red-600 px-2 py-1 text-xs text-white">Sous le seuil</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Historique des mouvements ({mouvements.length} derniers)</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Date et heure</th>
                <th className="p-2">Produit</th>
                <th className="p-2">Type</th>
                <th className="p-2">Variation</th>
                <th className="p-2">Réf.</th>
                <th className="p-2">Auteur</th>
              </tr>
            </thead>
            <tbody>
              {mouvements.map((m) => (
                <tr key={m.id} className="border-b">
                  <td className="p-2">{m.creeLe.toLocaleString("fr-FR")}</td>
                  <td className="p-2">{m.produit.nom}</td>
                  <td className="p-2">{TYPES[m.type] ?? m.type}</td>
                  <td className={m.variationPieces >= 0 ? "p-2 text-green-700" : "p-2 text-red-600"}>
                    {m.variationPieces > 0 ? "+" : ""}
                    {m.variationPieces}
                  </td>
                  <td className="p-2">{m.reference ?? "-"}</td>
                  <td className="p-2">{m.auteur.nom}</td>
                </tr>
              ))}
              {mouvements.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-2 text-gray-500">
                    Aucun mouvement pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}