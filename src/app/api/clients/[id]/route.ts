import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { secteurDuJour } from "@/lib/secteur";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole("GERANT", "MAGASINIER", "LIVREUR");
  if ("error" in auth) return auth.error;

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({
    where: { id },
    include: { secteur: true },
  });
  const introuvable = NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (!client) return introuvable;

  if (auth.user.role === "LIVREUR") {
    const secteur = await secteurDuJour(auth.user.id);
    if (!secteur || secteur.id !== client.secteurId) return introuvable;
  }
  return NextResponse.json(client);
}