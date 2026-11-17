import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { ajustementSchema } from "@/lib/validation";
import { stockProduit } from "@/lib/stock";

export async function POST(req: Request) {
  const auth = await requireApiRole("MAGASINIER");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = ajustementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { produitId, sens, cartons, pieces, motif } = parsed.data;

  const produit = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!produit) {
    return NextResponse.json({ error: "Produit introuvable" }, { status: 400 });
  }

  const total = cartons * produit.piecesParCarton + pieces;
  if (total <= 0) {
    return NextResponse.json({ error: "La quantité doit être supérieure à zéro" }, { status: 400 });
  }
  const variation = sens === "RETRAIT" ? -total : total;

  if (variation < 0) {
    const stock = await stockProduit(produitId);
    if (stock + variation < 0) {
      return NextResponse.json(
        { error: `Stock insuffisant : ${stock} pièces disponibles` },
        { status: 400 }
      );
    }
  }

  const ajustement = await prisma.ajustementStock.create({
    data: { produitId, variationPieces: variation, motif, demandeParId: auth.user.id },
  });
  return NextResponse.json(ajustement, { status: 201 });
}