import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { ligneDecisionSchema } from "@/lib/validation";
import { Refus, reponseRefus } from "@/lib/errors";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; ligneId: string }> }
) {
  const auth = await requireApiRole("MAGASINIER");
  if ("error" in auth) return auth.error;

  const p = await params;
  const id = Number(p.id);
  const ligneId = Number(p.ligneId);
  if (!Number.isInteger(id) || !Number.isInteger(ligneId)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = ligneDecisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { decision, quantiteAccordee, motif } = parsed.data;

  try {
    const ligne = await prisma.$transaction(async (tx) => {
      const bon = await tx.bonChargement.findUnique({ where: { id } });
      if (!bon) throw new Refus(404, "Bon introuvable");
      if (bon.statut !== "ENVOYE") throw new Refus(409, "Ce bon n'est pas en cours de contrôle");

      const ligne = await tx.ligneChargement.findFirst({ where: { id: ligneId, bonId: id } });
      if (!ligne) throw new Refus(404, "Ligne introuvable");

      const motifOk = !!motif && motif.length >= 3;

      if (decision === "REJETEE") {
        if (!motifOk) throw new Refus(400, "Un motif est obligatoire pour rejeter une ligne");
        return tx.ligneChargement.update({
          where: { id: ligneId },
          data: { decision: "REJETEE", quantiteAccordee: 0, motif },
        });
      }

      const qte = quantiteAccordee ?? ligne.quantiteDemandee;
      if (qte < 1 || qte > ligne.quantiteDemandee) {
        throw new Refus(400, `La quantité accordée doit être comprise entre 1 et ${ligne.quantiteDemandee}`);
      }
      if (qte !== ligne.quantiteDemandee && !motifOk) {
        throw new Refus(400, "Un motif est obligatoire pour modifier la quantité");
      }
      return tx.ligneChargement.update({
        where: { id: ligneId },
        data: {
          decision: "ACCEPTEE",
          quantiteAccordee: qte,
          motif: qte !== ligne.quantiteDemandee ? motif : null,
        },
      });
    });
    return NextResponse.json(ligne);
  } catch (e) {
    return reponseRefus(e);
  }
}