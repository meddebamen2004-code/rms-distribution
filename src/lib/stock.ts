import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Convertit un total de pièces en cartons + pièces restantes
export function cartonsEtPieces(total: number, parCarton: number) {
  const cartons = Math.floor(total / parCarton);
  return { cartons, pieces: total - cartons * parCarton };
}

// Stock du dépôt par produit = somme des mouvements
export async function stockParProduit(): Promise<Map<number, number>> {
  const lignes = await prisma.mouvementStock.groupBy({
    by: ["produitId"],
    _sum: { variationPieces: true },
  });
  return new Map(lignes.map((l) => [l.produitId, l._sum.variationPieces ?? 0]));
}

// Stock actuel d'un produit (utilisable dans une transaction)
export async function stockProduit(
  produitId: number,
  db: Prisma.TransactionClient = prisma
): Promise<number> {
  const r = await db.mouvementStock.aggregate({
    where: { produitId },
    _sum: { variationPieces: true },
  });
  return r._sum.variationPieces ?? 0;
}