import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { stockParProduit } from "@/lib/stock";
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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link href="/gerant" className="text-blue-700 underline">
        ← Espace gérant
      </Link>
      <h1 className="text-2xl font-bold">Ajustements de stock</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">À valider ({enAttente.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Demandé par</th>
                <th className="p-2">Produit</th>
                <th className="p-2">Stock actuel</th>
                <th className="p-2">Variation</th>
                <th className="p-2">Motif</th>
                <th className="p-2">Décision</th>
              </tr>
            </thead>
            <tbody>
              {enAttente.map((a) => (
                <tr key={a.id} className="border-b align-top">
                  <td className="p-2">{a.creeLe.toLocaleString("fr-FR")}</td>
                  <td className="p-2">{a.demandePar.nom}</td>
                  <td className="p-2">{a.produit.nom}</td>
                  <td className="p-2">{stock.get(a.produitId) ?? 0}</td>
                  <td className={a.variationPieces >= 0 ? "p-2 text-green-700" : "p-2 text-red-600"}>
                    {a.variationPieces > 0 ? "+" : ""}
                    {a.variationPieces}
                  </td>
                  <td className="p-2">{a.motif}</td>
                  <td className="p-2">
                    <DecisionAjustement id={a.id} />
                  </td>
                </tr>
              ))}
              {enAttente.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-2 text-gray-500">
                    Aucune demande en attente.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Historique des décisions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Décidé le</th>
                <th className="p-2">Produit</th>
                <th className="p-2">Variation</th>
                <th className="p-2">Demandé par</th>
                <th className="p-2">Décidé par</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Commentaire</th>
              </tr>
            </thead>
            <tbody>
              {traites.map((a) => (
                <tr key={a.id} className="border-b">
                  <td className="p-2">{a.decideLe?.toLocaleString("fr-FR") ?? "-"}</td>
                  <td className="p-2">{a.produit.nom}</td>
                  <td className="p-2">
                    {a.variationPieces > 0 ? "+" : ""}
                    {a.variationPieces}
                  </td>
                  <td className="p-2">{a.demandePar.nom}</td>
                  <td className="p-2">{a.decidePar?.nom ?? "-"}</td>
                  <td className="p-2">
                    <StatutAjustement statut={a.statut} />
                  </td>
                  <td className="p-2">{a.commentaireGerant ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}