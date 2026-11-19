import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { BON_LISTE_INCLUDE } from "@/lib/bons";
import PageHeader from "@/components/ui/PageHeader";
import BonsCard from "@/components/BonsCard";

export default async function MagasinierBonsPage() {
  await requireRole("MAGASINIER");

  const bons = await prisma.bonChargement.findMany({
    where: { statut: { not: "BROUILLON" } },
    include: BON_LISTE_INCLUDE,
    orderBy: [{ jour: "desc" }, { id: "desc" }],
    take: 80,
  });
  const par = (...statuts: string[]) => bons.filter((b) => statuts.includes(b.statut));

  return (
    <>
      <PageHeader
        eyebrow="Chargement"
        title="Demandes de recharge"
        subtitle="Contrôlez les demandes des livreurs, puis chargez les camions."
      />
      <BonsCard titre="À contrôler" bons={par("ENVOYE")} basePath="/magasinier/bons" vide="Aucune demande à contrôler." />
      <BonsCard titre="À charger" bons={par("VALIDE")} basePath="/magasinier/bons" vide="Aucun bon validé en attente de chargement." />
      <BonsCard titre="En attente du gérant" bons={par("CONTROLE")} basePath="/magasinier/bons" vide="Aucune demande en attente." />
      <BonsCard titre="Historique" bons={par("CHARGE", "REFUSE")} basePath="/magasinier/bons" vide="Aucun historique pour l’instant." />
    </>
  );
}