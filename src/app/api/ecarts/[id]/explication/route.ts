import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { explicationSchema } from "@/lib/validation";
import { expliquerEcart } from "@/lib/verification";
import { reponseRefus } from "@/lib/errors";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole("LIVREUR");
  if ("error" in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = explicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const ecart = await prisma.$transaction((tx) =>
      expliquerEcart(tx, auth.user.id, id, parsed.data.commentaire, parsed.data.motif)
    );
    return NextResponse.json(ecart);
  } catch (e) {
    return reponseRefus(e);
  }
}