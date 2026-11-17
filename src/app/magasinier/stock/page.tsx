import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
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
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link href="/magasinier" className="text-blue-700 underline">
        ← Espace magasinier
      </Link>
      <h1 className="text-2xl font-bold">Stock du dépôt</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Nouvelle réception fournisseur</h2>
        <ReceptionForm produits={options} />
      </section>

      <StockView />
    </main>
  );
}