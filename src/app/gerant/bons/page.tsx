import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { BON_LISTE_INCLUDE } from "@/lib/bons";
import PageHeader from "@/components/ui/PageHeader";
import BonsCard from "@/components/BonsCard";

export default async function GerantBonsPage() {
  await requireRole("GERANT");

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
        subtitle="Dernier contrôle avant le chargement des camions."
      />
      <BonsCard titre="À valider" bons={par("CONTROLE")} basePath="/gerant/bons" vide="Aucune demande à valider." />
      <BonsCard titre="En cours de contrôle" bons={par("ENVOYE")} basePath="/gerant/bons" vide="Aucune demande en cours de contrôle." />
      <BonsCard titre="À charger" bons={par("VALIDE")} basePath="/gerant/bons" vide="Aucun bon en attente de chargement." />
      <BonsCard titre="Historique" bons={par("CHARGE", "REFUSE")} basePath="/gerant/bons" vide="Aucun historique pour l’instant." />
    </>
  );
}