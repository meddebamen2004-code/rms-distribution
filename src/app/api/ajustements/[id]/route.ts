import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { decisionAjustementSchema } from "@/lib/validation";
import { stockProduit } from "@/lib/stock";

class Refus extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireApiRole("GERANT");
  if ("error" in auth) return auth.error;

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }

  const body = await req.json().catch(() => null);
  const parsed = decisionAjustementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { decision, commentaire } = parsed.data;

  try {
    const resultat = await prisma.$transaction(async (tx) => {
      const aj = await tx.ajustementStock.findUnique({ where: { id } });
      if (!aj) throw new Refus(404, "Ajustement introuvable");
      if (aj.statut !== "EN_ATTENTE") throw new Refus(409, "Cet ajustement a déjà été traité");

      const decision_ = { decideParId: auth.user.id, decideLe: new Date() };

      if (decision === "REFUSER") {
        return tx.ajustementStock.update({
          where: { id },
          data: { ...decision_, statut: "REFUSE", commentaireGerant: commentaire },
        });
      }

      // Le stock a pu changer depuis la demande : on revérifie avant un retrait
      if (aj.variationPieces < 0) {
        const stock = await stockProduit(aj.produitId, tx);
        if (stock + aj.variationPieces < 0) {
          throw new Refus(409, `Stock insuffisant (${stock} pièces) : retrait impossible`);
        }
      }

      const mouvement = await tx.mouvementStock.create({
        data: {
          type: "AJUSTEMENT",
          variationPieces: aj.variationPieces,
          motif: aj.motif,
          produitId: aj.produitId,
          auteurId: aj.demandeParId,
        },
      });
      return tx.ajustementStock.update({
        where: { id },
        data: {
          ...decision_,
          statut: "VALIDE",
          commentaireGerant: commentaire || null,
          mouvementId: mouvement.id,
        },
      });
    });
    return NextResponse.json(resultat);
  } catch (e) {
    if (e instanceof Refus) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}