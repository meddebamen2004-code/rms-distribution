import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { labelJour } from "@/lib/dates";
import { BON_INCLUDE } from "@/lib/bons";
import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert";
import StatutBon from "@/components/StatutBon";
import BonDetail from "@/components/BonDetail";
import BonActions from "@/components/BonActions";

export default async function BonGerantPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("GERANT");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const bon = await prisma.bonChargement.findUnique({ where: { id }, include: BON_INCLUDE });
  if (!bon || bon.statut === "BROUILLON") notFound();

  return (
    <>
      <Link href="/gerant/bons" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
        <ChevronLeft size={16} /> Toutes les demandes
      </Link>
      <PageHeader
        eyebrow="Demande de recharge"
        title={`${bon.livreur.nom} · ${labelJour(bon.jour)}`}
        action={<StatutBon statut={bon.statut} />}
      />

      {bon.statut === "REFUSE" && bon.commentaire && (
        <div className="mb-4">
          <Alert title="Refusé par le magasinier">{bon.commentaire}</Alert>
        </div>
      )}

      <BonDetail bon={bon} />

      {bon.statut === "CONTROLE" && (
        <BonActions
          bonId={bon.id}
          redirectTo="/gerant/bons"
          hint="Renvoyer la demande la remet au magasinier avec votre commentaire."
          actions={[
            { action: "VALIDER", label: "Valider la demande" },
            { action: "RENVOYER", label: "Renvoyer avec un commentaire", variant: "secondary", needsComment: true },
          ]}
        />
      )}
    </>
  );
}