import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { tourneeActionSchema } from "@/lib/validation";
import { decharger } from "@/lib/verification";
import { reponseRefus } from "@/lib/errors";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole("MAGASINIER");
  if ("error" in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = tourneeActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const tournee = await prisma.$transaction((tx) => decharger(tx, auth.user.id, id));
    return NextResponse.json(tournee);
  } catch (e) {
    return reponseRefus(e);
  }
}