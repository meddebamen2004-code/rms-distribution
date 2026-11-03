import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { produitSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await requireApiRole("GERANT");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = produitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const categorie = await prisma.categorie.findUnique({
    where: { id: parsed.data.categorieId },
  });
  if (!categorie) {
    return NextResponse.json({ error: "Catégorie introuvable" }, { status: 400 });
  }

  try {
    const produit = await prisma.produit.create({ data: parsed.data });
    return NextResponse.json(produit, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Cette référence existe déjà" }, { status: 409 });
    }
    throw e;
  }
}