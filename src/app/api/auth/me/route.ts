import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const user = await prisma.utilisateur.findUnique({
    where: { id: session.userId },
    select: { id: true, nom: true, identifiant: true, role: true, actif: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (!user.actif) {
    return NextResponse.json({ error: "Compte désactivé" }, { status: 403 });
  }
  return NextResponse.json(user);
}