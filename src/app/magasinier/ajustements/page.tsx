import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link href="/magasinier" className="text-blue-700 underline">
        ← Espace magasinier
      </Link>
      <h1 className="text-2xl font-bold">Ajustements de stock</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Nouvelle demande de correction</h2>
        <AjustementForm produits={options} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Mes demandes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Date</th>
                <th className="p-2">Produit</th>
                <th className="p-2">Variation</th>
                <th className="p-2">Motif</th>
                <th className="p-2">Statut</th>
                <th className="p-2">Commentaire du gérant</th>
              </tr>
            </thead>
            <tbody>
              {demandes.map((d) => (
                <tr key={d.id} className="border-b">
                  <td className="p-2">{d.creeLe.toLocaleString("fr-FR")}</td>
                  <td className="p-2">{d.produit.nom}</td>
                  <td className={d.variationPieces >= 0 ? "p-2 text-green-700" : "p-2 text-red-600"}>
                    {d.variationPieces > 0 ? "+" : ""}
                    {d.variationPieces}
                  </td>
                  <td className="p-2">{d.motif}</td>
                  <td className="p-2">
                    <StatutAjustement statut={d.statut} />
                  </td>
                  <td className="p-2">{d.commentaireGerant ?? "-"}</td>
                </tr>
              ))}
              {demandes.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-2 text-gray-500">
                    Aucune demande pour l'instant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}