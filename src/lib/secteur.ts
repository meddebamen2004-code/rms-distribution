import { prisma } from "./prisma";
import { today } from "./dates";

export async function secteurDuJour(livreurId: number) {
  const aff = await prisma.affectation.findUnique({
    where: { livreurId_jour: { livreurId, jour: today() } },
    include: { secteur: true },
  });
  return aff?.secteur ?? null;
}

export async function clientsDuJour(livreurId: number) {
  const secteur = await secteurDuJour(livreurId);
  if (!secteur) return { secteur: null, clients: [] };
  const clients = await prisma.client.findMany({
    where: { secteurId: secteur.id },
    orderBy: { nomCommerce: "asc" },
  });
  return { secteur, clients };
}