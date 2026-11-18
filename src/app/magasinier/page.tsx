import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { stockParProduit } from "@/lib/stock";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";

export default async function MagasinierPage() {
  const user = await requireRole("MAGASINIER");

  const [produits, stock, enAttente] = await Promise.all([
    prisma.produit.findMany({ where: { archive: false } }),
    stockParProduit(),
    prisma.ajustementStock.count({ where: { demandeParId: user.id, statut: "EN_ATTENTE" } }),
  ]);
  const sousSeuil = produits.filter((p) => (stock.get(p.id) ?? 0) < p.seuilMin).length;

  return (
    <>
      <PageHeader
        eyebrow="Vue d’ensemble"
        title={`Bonjour ${user.nom.split(" ")[0]},`}
        subtitle="Voici l’état du dépôt."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <StatCard
          label="Produits sous le seuil"
          value={sousSeuil}
          hint="À réapprovisionner"
          href="/magasinier/stock"
        />
        <StatCard
          label="Mes ajustements en attente"
          value={enAttente}
          hint="En attente de validation du gérant"
          href="/magasinier/ajustements"
        />
      </div>
    </>
  );
}