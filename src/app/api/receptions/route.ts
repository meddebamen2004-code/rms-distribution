import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { receptionSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await requireApiRole("MAGASINIER");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = receptionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { reference, lignes } = parsed.data;

  const ids = [...new Set(lignes.map((l) => l.produitId))];
  const produits = await prisma.produit.findMany({ where: { id: { in: ids } } });
  const parId = new Map(produits.map((p) => [p.id, p]));

  const mouvements = [];
  for (const [i, l] of lignes.entries()) {
    const produit = parId.get(l.produitId);
    if (!produit || produit.archive) {
      return NextResponse.json({ error: `Ligne ${i + 1} : produit introuvable ou archivé` }, { status: 400 });
    }
    const total = l.cartons * produit.piecesParCarton + l.pieces;
    if (total <= 0) {
      return NextResponse.json({ error: `Ligne ${i + 1} : la quantité doit être supérieure à zéro` }, { status: 400 });
    }
    mouvements.push({
      type: "ENTREE_FOURNISSEUR",
      variationPieces: total,
      reference: reference || null,
      produitId: produit.id,
      auteurId: auth.user.id,
    });
  }

  // Tout ou rien : si une ligne échoue, aucune n'est enregistrée
  await prisma.$transaction(mouvements.map((data) => prisma.mouvementStock.create({ data })));
  return NextResponse.json({ ok: true, lignes: mouvements.length }, { status: 201 });
}
