import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { secteurSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const auth = await requireApiRole("GERANT");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = secteurSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const secteur = await prisma.secteur.create({ data: parsed.data });
    return NextResponse.json(secteur, { status: 201 });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "Ce secteur existe déjà" }, { status: 409 });
    }
    throw e;
  }
}