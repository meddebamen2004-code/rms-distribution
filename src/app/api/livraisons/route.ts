import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { livraisonSchema } from "@/lib/validation";
import { enregistrerLivraison } from "@/lib/livraisons";
import { reponseRefus } from "@/lib/errors";

export async function POST(req: Request) {
  const auth = await requireApiRole("LIVREUR");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = livraisonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const livraison = await prisma.$transaction((tx) =>
      enregistrerLivraison(tx, auth.user.id, parsed.data.clientId, parsed.data.lignes)
    );
    return NextResponse.json(livraison, { status: 201 });
  } catch (e) {
    return reponseRefus(e);
  }
}