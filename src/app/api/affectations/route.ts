import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { affectationSchema } from "@/lib/validation";

export async function PUT(req: Request) {
  const auth = await requireApiRole("GERANT");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = affectationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { livreurId, secteurId, jour } = parsed.data;

  const livreur = await prisma.utilisateur.findUnique({ where: { id: livreurId } });
  if (!livreur || livreur.role !== "LIVREUR" || !livreur.actif) {
    return NextResponse.json({ error: "Livreur introuvable" }, { status: 400 });
  }
  const secteur = await prisma.secteur.findUnique({ where: { id: secteurId } });
  if (!secteur) {
    return NextResponse.json({ error: "Secteur introuvable" }, { status: 400 });
  }

  const affectation = await prisma.affectation.upsert({
    where: { livreurId_jour: { livreurId, jour } },
    update: { secteurId },
    create: { livreurId, secteurId, jour },
  });
  return NextResponse.json(affectation);
}