import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { livraisonActionSchema } from "@/lib/validation";
import { annulerLivraison } from "@/lib/livraisons";
import { reponseRefus } from "@/lib/errors";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole("LIVREUR");
  if ("error" in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = livraisonActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const livraison = await prisma.$transaction((tx) => annulerLivraison(tx, auth.user.id, id));
    return NextResponse.json(livraison);
  } catch (e) {
    return reponseRefus(e);
  }
}