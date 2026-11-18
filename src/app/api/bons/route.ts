import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { bonSchema } from "@/lib/validation";
import { isValidISODate, today } from "@/lib/dates";
import { preparerLignes } from "@/lib/chargement";
import { Refus, reponseRefus } from "@/lib/errors";

export async function POST(req: Request) {
  const auth = await requireApiRole("LIVREUR");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = bonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { jour, lignes, envoyer } = parsed.data;
  if (!isValidISODate(jour) || jour < today()) {
    return NextResponse.json({ error: "La date doit être aujourd'hui ou plus tard" }, { status: 400 });
  }

  try {
    const bon = await prisma.$transaction(async (tx) => {
      const existe = await tx.bonChargement.findUnique({
        where: { livreurId_jour: { livreurId: auth.user.id, jour } },
      });
      if (existe) throw new Refus(409, "Un bon existe déjà pour ce jour");

      const data = await preparerLignes(lignes, tx);
      return tx.bonChargement.create({
        data: {
          jour,
          livreurId: auth.user.id,
          statut: envoyer ? "ENVOYE" : "BROUILLON",
          envoyeLe: envoyer ? new Date() : null,
          lignes: { create: data },
        },
        include: { lignes: true },
      });
    });
    return NextResponse.json(bon, { status: 201 });
  } catch (e) {
    return reponseRefus(e);
  }
}