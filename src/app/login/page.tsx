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
    <main className="flex min-h-screen">
      <section className="hidden flex-1 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-blue-800 p-12 text-white lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-bold text-blue-700">
            R
          </div>
          <span className="font-semibold">RMS Distribution</span>
        </div>
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-300">
            Gestion logistique simplifiée
          </p>
          <h1 className="mt-4 text-5xl font-bold leading-tight">
            Votre dépôt et vos tournées, enfin synchronisés.
          </h1>
          <p className="mt-6 text-lg text-blue-100">
            Suivez le stock, sécurisez chaque chargement et gardez une vision claire de vos
            livraisons.
          </p>
        </div>
        <p className="text-sm text-blue-200">Projet de 2ème année du cycle ingénieur</p>
      </section>

      <section className="flex flex-1 items-center justify-center bg-white px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Bienvenue</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Connectez-vous</h2>
          <p className="mt-2 text-sm text-slate-500">Accédez à votre espace de travail sécurisé.</p>
          <div className="mt-8">
            <LoginForm />
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Besoin d’aide ? Contactez votre administrateur.
          </p>
        </div>
      </section>
    </main>
  );
}