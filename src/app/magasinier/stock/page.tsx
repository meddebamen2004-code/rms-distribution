import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import StockView from "@/components/StockView";
import ReceptionForm from "@/components/ReceptionForm";

export default async function MagasinierStockPage() {
  await requireRole("MAGASINIER");

  const produits = await prisma.produit.findMany({
    where: { archive: false },
    orderBy: { nom: "asc" },
  });
  const options = produits.map((p) => ({
    id: p.id,
    label: `${p.nom} (${p.reference})`,
    piecesParCarton: p.piecesParCarton,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Dépôt"
        title="Stock et réceptions"
        subtitle="Enregistrez les entrées de marchandise et consultez le stock."
      />

      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-base font-semibold text-slate-900">Nouvelle réception fournisseur</h2>
        <ReceptionForm produits={options} />
      </Card>

      <StockView />
    </>
  );
} 