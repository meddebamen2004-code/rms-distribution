import { NextResponse } from "next/server";
import { prisma } from "./prisma";
import { getSession } from "./session";
import type { Role } from "./roles";

export async function requireApiRole(...roles: Role[]) {
  const session = await getSession();
  if (!session) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  const user = await prisma.utilisateur.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, actif: true },
  });
  if (!user || !user.actif) {
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) };
  }
  if (!roles.includes(user.role as Role)) {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  return { user };
}