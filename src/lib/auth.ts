import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { getSession } from "./session";
import { HOME_BY_ROLE, type Role } from "./roles";

export async function requireRole(role: Role) {
  const session = await getSession();
  if (!session) redirect("/login");

  const user = await prisma.utilisateur.findUnique({
    where: { id: session.userId },
    select: { id: true, nom: true, identifiant: true, role: true, actif: true },
  });
  if (!user || !user.actif) redirect("/login");

  if (user.role !== role) redirect(HOME_BY_ROLE[user.role as Role]);
  return user;
}