import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { cartonsEtPieces, stockParProduit } from "@/lib/stock";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import ProduitModal from "@/components/ProduitModal";
import ProduitsTable, { type ProduitRow } from "@/components/ProduitsTable";
import CategorieForm from "@/components/CategorieForm";

export default async function ProduitsPage() {
  await requireRole("GERANT");

  const [categories, produits, stock] = await Promise.all([
    prisma.categorie.findMany({ orderBy: { nom: "asc" } }),
    prisma.produit.findMany({
      include: { categorie: true },
      orderBy: [{ archive: "asc" }, { nom: "asc" }],
    }),
    stockParProduit(),
  ]);

  const rows: ProduitRow[] = produits.map((p) => {
    const total = stock.get(p.id) ?? 0;
    const { cartons, pieces } = cartonsEtPieces(total, p.piecesParCarton);
    return {
      id: p.id,
      reference: p.reference,
      nom: p.nom,
      categorie: p.categorie.nom,
      prix: p.prix,
      piecesParCarton: p.piecesParCarton,
      archive: p.archive,
      stockLabel: `${cartons} cartons${pieces ? ` + ${pieces} p.` : ""}`,
      bas: total < p.seuilMin,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Produits"
        subtitle="Gérez les références disponibles au dépôt."
        action={<ProduitModal categories={categories} />}
      />

      <ProduitsTable rows={rows} categories={categories.map((c) => c.nom)} />

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold text-slate-900">Catégories</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Badge key={c.id} tone="blue">
              {c.nom}
            </Badge>
          ))}
          {categories.length === 0 && <p className="text-sm text-slate-500">Aucune catégorie.</p>}
        </div>
        <div className="mt-4">
          <CategorieForm />
        </div>
      </Card>
    </>
  );
}