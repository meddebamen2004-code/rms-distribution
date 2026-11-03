import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { produitUpdateSchema } from "@/lib/validation";

// Pas de DELETE : un produit se modifie ou s'archive, il ne se supprime jamais.
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
  const parsed = produitUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const produit = await prisma.produit.update({ where: { id }, data: parsed.data });
    return NextResponse.json(produit);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2025") {
        return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
      }
      if (e.code === "P2002") {
        return NextResponse.json({ error: "Cette référence existe déjà" }, { status: 409 });
      }
    }
    throw e;
  }
}