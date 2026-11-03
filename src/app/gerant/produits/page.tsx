import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import ProduitForm from "@/components/ProduitForm";
import CategorieForm from "@/components/CategorieForm";
import ArchiveButton from "@/components/ArchiveButton";

export default async function ProduitsPage() {
  await requireRole("GERANT");

  const categories = await prisma.categorie.findMany({ orderBy: { nom: "asc" } });
  const produits = await prisma.produit.findMany({
    include: { categorie: true },
    orderBy: [{ archive: "asc" }, { nom: "asc" }],
  });

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link href="/gerant" className="text-blue-700 underline">
        ← Espace gérant
      </Link>
      <h1 className="text-2xl font-bold">Produits</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Catégories</h2>
        <p className="text-gray-600">{categories.map((c) => c.nom).join(" · ") || "Aucune"}</p>
        <CategorieForm />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Nouveau produit</h2>
        <ProduitForm categories={categories} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Catalogue ({produits.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Référence</th>
                <th className="p-2">Nom</th>
                <th className="p-2">Catégorie</th>
                <th className="p-2">Prix</th>
                <th className="p-2">Pièces/carton</th>
                <th className="p-2">Seuil</th>
                <th className="p-2">Péremption</th>
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {produits.map((p) => (
                <tr key={p.id} className={p.archive ? "border-b text-gray-400" : "border-b"}>
                  <td className="p-2">{p.reference}</td>
                  <td className="p-2">
                    {p.nom} {p.archive && <em>(archivé)</em>}
                  </td>
                  <td className="p-2">{p.categorie.nom}</td>
                  <td className="p-2">{p.prix.toFixed(2)}</td>
                  <td className="p-2">{p.piecesParCarton}</td>
                  <td className="p-2">{p.seuilMin}</td>
                  <td className="p-2">
                    {p.datePeremption ? p.datePeremption.toLocaleDateString("fr-FR") : "-"}
                  </td>
                  <td className="p-2">
                    <ArchiveButton id={p.id} archive={p.archive} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}