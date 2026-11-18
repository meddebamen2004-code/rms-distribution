import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { stockProduit } from "./stock";
import { Refus } from "./errors";

type Db = Prisma.TransactionClient;

export type LigneSaisie = { produitId: number; cartons: number; pieces: number };

// Valide les lignes d'une demande et les convertit en pièces.
// Une quantité supérieure au stock du dépôt est refusée (cahier des charges 4.5.2).
export async function preparerLignes(lignes: LigneSaisie[], db: Db = prisma) {
  const ids = lignes.map((l) => l.produitId);
  if (new Set(ids).size !== ids.length) {
    throw new Refus(400, "Un produit apparaît plusieurs fois dans le bon");
  }
  const produits = await db.produit.findMany({ where: { id: { in: ids } } });
  const parId = new Map(produits.map((p) => [p.id, p]));

  const data: { produitId: number; quantiteDemandee: number }[] = [];
  for (const [i, l] of lignes.entries()) {
    const p = parId.get(l.produitId);
    if (!p || p.archive) {
      throw new Refus(400, `Ligne ${i + 1} : produit introuvable ou archivé`);
    }
    const total = l.cartons * p.piecesParCarton + l.pieces;
    if (total <= 0) {
      throw new Refus(400, `Ligne ${i + 1} : la quantité doit être supérieure à zéro`);
    }
    const stock = await stockProduit(p.id, db);
    if (total > stock) {
      throw new Refus(400, `Stock insuffisant pour « ${p.nom} » : ${stock} pièces disponibles`);
    }
    data.push({ produitId: p.id, quantiteDemandee: total });
  }
  return data;
}

export type BonComplet = Prisma.BonChargementGetPayload<{
  include: { lignes: { include: { produit: true } } };
}>;

// Chargement physique : le stock passe du dépôt au camion, la tournée est créée.
// Doit être appelée dans une transaction : tout est enregistré, ou rien.
export async function chargerBon(tx: Db, bon: BonComplet, auteurId: number) {
  const camion = await tx.camion.findUnique({ where: { livreurId: bon.livreurId } });
  if (!camion) throw new Refus(409, "Aucun camion n'est affecté à ce livreur");

  const affectation = await tx.affectation.findUnique({
    where: { livreurId_jour: { livreurId: bon.livreurId, jour: bon.jour } },
  });
  if (!affectation) {
    throw new Refus(409, "Aucun secteur n'est affecté à ce livreur pour ce jour");
  }

  for (const l of bon.lignes) {
    const qte = l.quantiteAccordee ?? 0;
    if (l.decision !== "ACCEPTEE" || qte <= 0) continue;

    // Le stock a pu baisser depuis la demande : on revérifie au dernier moment
    const stock = await stockProduit(l.produitId, tx);
    if (qte > stock) {
      throw new Refus(409, `Stock insuffisant pour « ${l.produit.nom} » : ${stock} pièces disponibles`);
    }
    const motif = `Chargement ${camion.immatriculation}`;
    await tx.mouvementStock.createMany({
      data: [
        { type: "CHARGEMENT", variationPieces: -qte, motif, produitId: l.produitId, auteurId, bonId: bon.id, camionId: null },
        { type: "CHARGEMENT", variationPieces: qte, motif, produitId: l.produitId, auteurId, bonId: bon.id, camionId: camion.id },
      ],
    });
  }

  await tx.tournee.create({
    data: {
      jour: bon.jour,
      livreurId: bon.livreurId,
      camionId: camion.id,
      secteurId: affectation.secteurId,
      bonId: bon.id,
    },
  });
  return tx.bonChargement.update({
    where: { id: bon.id },
    data: { statut: "CHARGE", chargeLe: new Date() },
  });
}