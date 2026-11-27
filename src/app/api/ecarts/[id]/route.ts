import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { decisionEcartSchema } from "@/lib/validation";
import { deciderEcart } from "@/lib/verification";
import { reponseRefus } from "@/lib/errors";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireApiRole("GERANT");
  if ("error" in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = decisionEcartSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const resultat = await prisma.$transaction((tx) =>
      deciderEcart(tx, auth.user.id, id, parsed.data.decision, parsed.data.commentaire)
    );
    return NextResponse.json(resultat);
  } catch (e) {
    return reponseRefus(e);
  }
}