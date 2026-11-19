import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { stockParProduit } from "@/lib/stock";
import { labelJour } from "@/lib/dates";
import { BON_INCLUDE } from "@/lib/bons";
import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert";
import StatutBon from "@/components/StatutBon";
import BonDetail from "@/components/BonDetail";
import BonActions from "@/components/BonActions";
import LigneControle, { type LigneControleData } from "@/components/LigneControle";

export default async function BonMagasinierPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("MAGASINIER");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [bon, stock] = await Promise.all([
    prisma.bonChargement.findUnique({ where: { id }, include: BON_INCLUDE }),
    stockParProduit(),
  ]);
  if (!bon || bon.statut === "BROUILLON") notFound();

  // Avant le chargement : le livreur a-t-il un camion et un secteur ce jour-là ?
  const [camion, affectation] =
    bon.statut === "VALIDE"
      ? await Promise.all([
          prisma.camion.findUnique({ where: { livreurId: bon.livreurId } }),
          prisma.affectation.findUnique({
            where: { livreurId_jour: { livreurId: bon.livreurId, jour: bon.jour } },
          }),
        ])
      : [null, null];

  const lignes: LigneControleData[] = bon.lignes.map((l) => ({
    id: l.id,
    nom: l.produit.nom,
    reference: l.produit.reference,
    piecesParCarton: l.produit.piecesParCarton,
    demandee: l.quantiteDemandee,
    stock: stock.get(l.produitId) ?? 0,
    decision: l.decision,
    accordee: l.quantiteAccordee,
    motif: l.motif,
  }));
  const traitees = lignes.filter((l) => l.decision !== "EN_ATTENTE").length;
  const pretASoumettre = traitees === lignes.length && lignes.some((l) => l.decision === "ACCEPTEE");

  return (
    <>
      <Link href="/magasinier/bons" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
        <ChevronLeft size={16} /> Toutes les demandes
      </Link>
      <PageHeader
        eyebrow="Demande de recharge"
        title={`${bon.livreur.nom} · ${labelJour(bon.jour)}`}
        action={<StatutBon statut={bon.statut} />}
      />

      {bon.statut === "ENVOYE" && bon.commentaire && (
        <div className="mb-4">
          <Alert tone="yellow" title="Renvoyé par le gérant">
            {bon.commentaire}
          </Alert>
        </div>
      )}

      {bon.statut === "ENVOYE" ? (
        <>
          <div className="space-y-3">
            {lignes.map((l) => (
              <LigneControle key={l.id} bonId={bon.id} ligne={l} />
            ))}
          </div>
          <p className="mt-6 text-sm font-medium text-slate-700">
            {traitees} ligne{traitees > 1 ? "s" : ""} sur {lignes.length} traitée{traitees > 1 ? "s" : ""}
          </p>
          <BonActions
            bonId={bon.id}
            redirectTo="/magasinier/bons"
            hint="Refuser le bon le renvoie au livreur avec votre commentaire."
            actions={[
              { action: "SOUMETTRE", label: "Soumettre au gérant", disabled: !pretASoumettre },
              { action: "REFUSER", label: "Refuser le bon", variant: "danger", needsComment: true },
            ]}
          />
        </>
      ) : (
        <>
          <BonDetail bon={bon} />
          {bon.statut === "VALIDE" && (
            <>
              {!camion && (
                <div className="mt-4">
                  <Alert tone="yellow" title="Aucun camion affecté à ce livreur" />
                </div>
              )}
              {!affectation && (
                <div className="mt-4">
                  <Alert tone="yellow" title="Aucun secteur affecté à ce livreur ce jour-là">
                    Demandez au gérant de compléter le planning avant le chargement.
                  </Alert>
                </div>
              )}
              <BonActions
                bonId={bon.id}
                redirectTo="/magasinier/bons"
                hint="Le stock passera du dépôt au camion et la tournée sera créée."
                actions={[
                  { action: "CHARGER", label: "Confirmer le chargement", disabled: !camion || !affectation },
                ]}
              />
            </>
          )}
        </>
      )}
    </>
  );
}