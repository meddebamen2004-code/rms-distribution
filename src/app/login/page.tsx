import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { HOME_BY_ROLE, type Role } from "@/lib/roles";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage() {
  // Déjà connecté (et compte actif) : direction son espace
  const session = await getSession();
  if (session) {
    const user = await prisma.utilisateur.findUnique({
      where: { id: session.userId },
      select: { role: true, actif: true },
    });
    if (user?.actif) redirect(HOME_BY_ROLE[user.role as Role]);
  }

  return (
    <main className="flex flex-col items-center gap-4 px-4 pt-24">
      <h1 className="text-2xl font-bold">RMS Distribution</h1>
      <p className="text-gray-600">Connexion</p>
      <LoginForm />
    </main>
  );
}