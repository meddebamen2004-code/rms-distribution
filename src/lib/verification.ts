import type { Prisma } from "@prisma/client";
import { Refus } from "./errors";
import { stockCamionParProduit } from "./stock";

type Db = Prisma.TransactionClient;

export const MOTIFS_ECART = ["CASSE", "ERREUR_LIVRAISON", "PRODUIT_MANQUANT", "AUTRE"] as const;
const motifValide = (m?: string | null) => (MOTIFS_ECART as readonly string[]).includes(m ?? "");

export type ReelleSaisie = {
  produitId: number;
  quantiteReelle: number;
  motif?: string | null;
  commentaire?: string | null;
};

// La tournée à vérifier : la plus récente encore en cours
export function tourneeAVerifier(db: Db, livreurId: number) {
  return db.tournee.findFirst({
    where: { livreurId, statut: "EN_COURS" },
    orderBy: { jour: "desc" },
  });
}

// Le livreur envoie ses quantités réelles. Seuls les produits dont la quantité
// diffère du stock théorique créent un écart ; les autres sont considérés conformes.
export async function verifierTournee(tx: Db, livreurId: number, reelles: ReelleSaisie[]) {
  const tournee = await tourneeAVerifier(tx, livreurId);
  if (!tournee) throw new Refus(409, "Aucune tournée en cours à vérifier");

  const ids = reelles.map((r) => r.produitId);
  if (new Set(ids).size !== ids.length) {
    throw new Refus(400, "Un produit apparaît plusieurs fois dans la vérification");
  }
  const stock = await stockCamionParProduit(tournee.camionId, tx);
  const produits = await tx.produit.findMany({ where: { id: { in: ids } } });
  const parId = new Map(produits.map((p) => [p.id, p]));

  const ecarts: {
    produitId: number;
    quantiteTheorique: number;
    quantiteReelle: number;
    motif: string;
    commentaire: string | null;
  }[] = [];

  for (const r of reelles) {
    const p = parId.get(r.produitId);
    if (!p) throw new Refus(400, "Produit introuvable");
    const theorique = stock.get(r.produitId) ?? 0;
    if (r.quantiteReelle === theorique) continue; // conforme : pas d'écart

    if (!motifValide(r.motif)) {
      throw new Refus(400, `« ${p.nom} » : choisissez un motif d'écart`);
    }
    if (r.motif === "AUTRE" && (r.commentaire ?? "").trim().length < 3) {
      throw new Refus(400, `« ${p.nom} » : précisez le motif « autre »`);
    }
    ecarts.push({
      produitId: p.id,
      quantiteTheorique: theorique,
      quantiteReelle: r.quantiteReelle,
      motif: r.motif as string,
      commentaire: r.commentaire?.trim() || null,
    });
  }

  const crees = [];
  for (const e of ecarts) {
    crees.push(await tx.ecartTournee.create({ data: { tourneeId: tournee.id, ...e } }));
  }
  const statut = ecarts.length > 0 ? "ECART_EN_ATTENTE" : "A_DECHARGER";
  await tx.tournee.update({ where: { id: tournee.id }, data: { statut, verifieLe: new Date() } });
  return { tourneeId: tournee.id, statut, ecarts: crees };
}

// Décision du gérant sur un écart. Quand tous les écarts sont acceptés, les
// ajustements sont créés sur le camion et la tournée est prête pour le déchargement.
export async function deciderEcart(
  tx: Db,
  gerantId: number,
  ecartId: number,
  decision: "ACCEPTER" | "DEMANDER_EXPLICATION",
  commentaire?: string
) {
  const e = await tx.ecartTournee.findUnique({
    where: { id: ecartId },
    include: { tournee: true },
  });
  if (!e) throw new Refus(404, "Écart introuvable");
  if (e.tournee.statut !== "ECART_EN_ATTENTE") {
    throw new Refus(409, "Cette tournée n'est plus en attente de décision");
  }
  if (e.statut === "ACCEPTE") throw new Refus(409, "Cet écart a déjà été accepté");
  if (e.statut === "EXPLICATION_DEMANDEE") {
    throw new Refus(409, "En attente de l'explication du livreur");
  }

  const maintenant = new Date();
  if (decision === "DEMANDER_EXPLICATION") {
    if (!commentaire || commentaire.length < 3) {
      throw new Refus(400, "Un commentaire est obligatoire pour demander une explication");
    }
    const maj = await tx.ecartTournee.update({
      where: { id: ecartId },
      data: {
        statut: "EXPLICATION_DEMANDEE",
        commentaireGerant: commentaire,
        decideParId: gerantId,
        decideLe: maintenant,
      },
    });
    return { id: maj.id, statut: maj.statut, tourneeFinalisee: false };
  }

  const maj = await tx.ecartTournee.update({
    where: { id: ecartId },
    data: {
      statut: "ACCEPTE",
      commentaireGerant: commentaire || null,
      decideParId: gerantId,
      decideLe: maintenant,
    },
  });

  const restants = await tx.ecartTournee.count({
    where: { tourneeId: e.tourneeId, statut: { not: "ACCEPTE" } },
  });
  if (restants > 0) return { id: maj.id, statut: maj.statut, tourneeFinalisee: false };

  // Tous les écarts sont acceptés : le camion est ramené à la quantité réelle
  const tous = await tx.ecartTournee.findMany({
    where: { tourneeId: e.tourneeId },
    include: { produit: true },
  });
  await tx.mouvementStock.createMany({
    data: tous.map((x) => ({
      type: "AJUSTEMENT",
      variationPieces: x.quantiteReelle - x.quantiteTheorique,
      motif: `Écart de tournée (${x.motif}) : ${x.produit.nom}`,
      produitId: x.produitId,
      camionId: e.tournee.camionId,
      tourneeId: e.tourneeId,
      auteurId: gerantId,
    })),
  });
  await tx.tournee.update({ where: { id: e.tourneeId }, data: { statut: "A_DECHARGER" } });
  return { id: maj.id, statut: maj.statut, tourneeFinalisee: true };
}

// Le livreur répond à une demande d'explication : l'écart revient au gérant
export async function expliquerEcart(
  tx: Db,
  livreurId: number,
  ecartId: number,
  commentaire: string,
  motif?: string
) {
  const e = await tx.ecartTournee.findUnique({ where: { id: ecartId }, include: { tournee: true } });
  if (!e || e.tournee.livreurId !== livreurId) throw new Refus(404, "Écart introuvable");
  if (e.statut !== "EXPLICATION_DEMANDEE") {
    throw new Refus(409, "Aucune explication n'est demandée pour cet écart");
  }
  return tx.ecartTournee.update({
    where: { id: ecartId },
    data: {
      statut: "EN_ATTENTE",
      commentaire,
      motif: motif && motifValide(motif) ? motif : undefined,
    },
  });
}

// Déchargement : ce qui reste dans le camion revient au dépôt, la tournée est clôturée
export async function decharger(tx: Db, magasinierId: number, tourneeId: number) {
  const t = await tx.tournee.findUnique({ where: { id: tourneeId }, include: { camion: true } });
  if (!t) throw new Refus(404, "Tournée introuvable");
  if (t.statut !== "A_DECHARGER") {
    throw new Refus(409, "La tournée n'est pas prête pour le déchargement");
  }

  const stock = await stockCamionParProduit(t.camionId, tx);
  const mouvements: Prisma.MouvementStockCreateManyInput[] = [];
  for (const [produitId, qte] of stock) {
    if (qte < 0) throw new Refus(409, "Stock du camion négatif : contactez le gérant");
    if (qte === 0) continue;
    const base = {
      type: "DECHARGEMENT",
      produitId,
      auteurId: magasinierId,
      tourneeId: t.id,
      motif: `Déchargement ${t.camion.immatriculation}`,
    };
    mouvements.push({ ...base, variationPieces: -qte, camionId: t.camionId });
    mouvements.push({ ...base, variationPieces: qte, camionId: null });
  }
  if (mouvements.length > 0) await tx.mouvementStock.createMany({ data: mouvements });

  return tx.tournee.update({
    where: { id: t.id },
    data: { statut: "CLOTUREE", clotureeLe: new Date() },
  });
}