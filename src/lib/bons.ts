import type { Prisma } from "@prisma/client";

export const BON_INCLUDE = {
  lignes: { include: { produit: true }, orderBy: { produit: { nom: "asc" } } },
  livreur: true,
  controlePar: true,
  validePar: true,
} satisfies Prisma.BonChargementInclude;
export type BonAvecDetails = Prisma.BonChargementGetPayload<{ include: typeof BON_INCLUDE }>;

export const BON_LISTE_INCLUDE = {
  livreur: true,
  _count: { select: { lignes: true } },
} satisfies Prisma.BonChargementInclude;
export type BonListe = Prisma.BonChargementGetPayload<{ include: typeof BON_LISTE_INCLUDE }>;