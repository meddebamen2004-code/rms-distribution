import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { verificationSchema } from "@/lib/validation";
import { verifierTournee } from "@/lib/verification";
import { reponseRefus } from "@/lib/errors";

export async function POST(req: Request) {
  const auth = await requireApiRole("LIVREUR");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const parsed = verificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  try {
    const resultat = await prisma.$transaction((tx) =>
      verifierTournee(tx, auth.user.id, parsed.data.reelles)
    );
    return NextResponse.json(resultat);
  } catch (e) {
    return reponseRefus(e);
  }
}