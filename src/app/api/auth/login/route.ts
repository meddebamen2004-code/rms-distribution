import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation";
import { createSession } from "@/lib/session";
import type { Role } from "@/lib/roles";

const MAX_TENTATIVES = 5;
const BLOCAGE_MINUTES = 15;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }
  const { identifiant, motDePasse } = parsed.data;

  const user = await prisma.utilisateur.findUnique({ where: { identifiant } });

  // Compte bloqué temporairement
  if (user?.bloqueJusqua && user.bloqueJusqua > new Date()) {
    return NextResponse.json(
      { error: "Compte bloqué temporairement. Réessayez plus tard." },
      { status: 429 }
    );
  }

  const ok = user ? await bcrypt.compare(motDePasse, user.motDePasseHash) : false;

  // Même message pour identifiant inconnu ou mauvais mot de passe
  if (!user || !ok) {
    if (user) {
      const tentatives = user.tentativesEchouees + 1;
      const bloquer = tentatives >= MAX_TENTATIVES;
      await prisma.utilisateur.update({
        where: { id: user.id },
        data: {
          tentativesEchouees: bloquer ? 0 : tentatives,
          bloqueJusqua: bloquer
            ? new Date(Date.now() + BLOCAGE_MINUTES * 60 * 1000)
            : null,
        },
      });
    }
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 401 }
    );
  }

  // Compte désactivé par le gérant
  if (!user.actif) {
    return NextResponse.json(
      { error: "Compte désactivé. Contactez le gérant." },
      { status: 403 }
    );
  }

  // Succès : remise à zéro du compteur
  if (user.tentativesEchouees > 0 || user.bloqueJusqua) {
    await prisma.utilisateur.update({
      where: { id: user.id },
      data: { tentativesEchouees: 0, bloqueJusqua: null },
    });
  }

  await createSession(user.id, user.role as Role);
  return NextResponse.json({ id: user.id, nom: user.nom, role: user.role });
}