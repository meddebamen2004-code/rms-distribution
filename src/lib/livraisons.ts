import type { Prisma } from "@prisma/client";
import { today } from "./dates";
import { Refus } from "./errors";
import { stockCamion } from "./stock";

type Db = Prisma.TransactionClient;

export type LigneLivraisonSaisie = {
  produitId: number;
  quantiteLivree: number;
  quantiteRetour: number;
  motifRetour?: string | null;
};

// Enregistre une livraison. À appeler dans une transaction : tout ou rien.
export async function enregistrerLivraison(
  tx: Db,
  livreurId: number,
  clientId: number,
  lignes: LigneLivraisonSaisie[]
) {
  // 1. Une tournée en cours aujourd'hui (bon chargé), sinon rien n'est possible
  const tournee = await tx.tournee.findUnique({
    where: { livreurId_jour: { livreurId, jour: today() } },
  });
  if (!tournee) {
    throw new Refus(409, "Aucune tournée aujourd'hui : votre demande de recharge doit d'abord être chargée");
  }
  if (tournee.statut !== "EN_COURS") {
    throw new Refus(409, "La tournée est clôturée : plus de livraison possible");
  }

  // 2. Le client doit appartenir au secteur du jour
  const affectation = await tx.affectation.findUnique({
    where: { livreurId_jour: { livreurId, jour: today() } },
  });
  const client = await tx.client.findUnique({ where: { id: clientId } });
  if (!client || !affectation || client.secteurId !== affectation.secteurId) {
    throw new Refus(404, "Client introuvable");
  }

  // 3. Les lignes
  const ids = lignes.map((l) => l.produitId);
  if (new Set(ids).size !== ids.length) {
    throw new Refus(400, "Un produit apparaît plusieurs fois dans la livraison");
  }
  const produits = await tx.produit.findMany({ where: { id: { in: ids } } });
  const parId = new Map(produits.map((p) => [p.id, p]));

  for (const [i, l] of lignes.entries()) {
    const p = parId.get(l.produitId);
    if (!p) throw new Refus(400, `Ligne ${i + 1} : produit introuvable`);
    if (l.quantiteLivree + l.quantiteRetour <= 0) {
      throw new Refus(400, `Ligne ${i + 1} : saisissez une quantité livrée ou retournée`);
    }
    if (l.quantiteRetour > 0 && !["ABIME", "REFUSE", "PERIME"].includes(l.motifRetour ?? "")) {
      throw new Refus(400, `« ${p.nom} » : choisissez un motif de retour (abîmé, refusé ou périmé)`);
    }
    if (l.quantiteLivree > 0) {
      const stock = await stockCamion(tournee.camionId, p.id, tx);
      if (l.quantiteLivree > stock) {
        throw new Refus(400, `« ${p.nom} » : il ne reste que ${stock} pièces dans le camion`);
      }
    }
  }

  // 4. Enregistrement
  const livraison = await tx.livraison.create({
    data: {
      tourneeId: tournee.id,
      clientId,
      lignes: {
        create: lignes.map((l) => ({
          produitId: l.produitId,
          quantiteLivree: l.quantiteLivree,
          quantiteRetour: l.quantiteRetour,
          motifRetour: l.quantiteRetour > 0 ? l.motifRetour : null,
        })),
      },
    },
  });

  const mouvements: Prisma.MouvementStockCreateManyInput[] = [];
  for (const l of lignes) {
    const base = {
      produitId: l.produitId,
      auteurId: livreurId,
      camionId: tournee.camionId,
      tourneeId: tournee.id,
      livraisonId: livraison.id,
    };
    if (l.quantiteLivree > 0) {
      mouvements.push({
        ...base,
        type: "LIVRAISON",
        variationPieces: -l.quantiteLivree,
        motif: `Livraison chez ${client.nomCommerce}`,
      });
    }
    if (l.quantiteRetour > 0) {
      mouvements.push({
        ...base,
        type: "RETOUR_CLIENT",
        variationPieces: l.quantiteRetour,
        motif: `Retour (${l.motifRetour}) chez ${client.nomCommerce}`,
      });
    }
  }
  await tx.mouvementStock.createMany({ data: mouvements });
  return livraison;
}

// Annule une livraison : mouvements inverses, rien n'est supprimé.
export async function annulerLivraison(tx: Db, livreurId: number, livraisonId: number) {
  const l = await tx.livraison.findUnique({
    where: { id: livraisonId },
    include: { lignes: { include: { produit: true } }, tournee: true, client: true },
  });
  if (!l || l.tournee.livreurId !== livreurId) throw new Refus(404, "Livraison introuvable");
  if (l.annulee) throw new Refus(409, "Cette livraison est déjà annulée");
  if (l.tournee.statut !== "EN_COURS") {
    throw new Refus(409, "La tournée est clôturée : annulation impossible");
  }

  // Annuler un retour retire des pièces du camion : elles doivent encore y être
  for (const ligne of l.lignes) {
    if (ligne.quantiteRetour > 0) {
      const stock = await stockCamion(l.tournee.camionId, ligne.produitId, tx);
      if (stock < ligne.quantiteRetour) {
        throw new Refus(
          409,
          `Annulation impossible : les ${ligne.quantiteRetour} pièces retournées de « ${ligne.produit.nom} » ne sont plus dans le camion`
        );
      }
    }
  }

  const mouvements: Prisma.MouvementStockCreateManyInput[] = [];
  for (const ligne of l.lignes) {
    const base = {
      produitId: ligne.produitId,
      auteurId: livreurId,
      camionId: l.tournee.camionId,
      tourneeId: l.tourneeId,
      livraisonId: l.id,
      type: "ANNULATION_LIVRAISON",
      motif: `Annulation de la livraison chez ${l.client.nomCommerce}`,
    };
    if (ligne.quantiteLivree > 0) mouvements.push({ ...base, variationPieces: ligne.quantiteLivree });
    if (ligne.quantiteRetour > 0) mouvements.push({ ...base, variationPieces: -ligne.quantiteRetour });
  }
  await tx.mouvementStock.createMany({ data: mouvements });
  return tx.livraison.update({
    where: { id: l.id },
    data: { annulee: true, annuleeLe: new Date() },
  });
}