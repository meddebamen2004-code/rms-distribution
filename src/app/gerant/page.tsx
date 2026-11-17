import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function GerantPage() {
  const user = await requireRole("GERANT");
  const enAttente = await prisma.ajustementStock.count({ where: { statut: "EN_ATTENTE" } });

  return (
    <main className="mx-auto max-w-md space-y-3 px-4 pt-24">
      <h1 className="text-2xl font-bold">Espace gérant</h1>
      <p>Bonjour {user.nom}</p>
      <Link href="/gerant/produits" className="block text-blue-700 underline">
        Gérer les produits
      </Link>
      <Link href="/gerant/clients" className="block text-blue-700 underline">
        Clients et secteurs
      </Link>
      <Link href="/gerant/planning" className="block text-blue-700 underline">
        Planning des livreurs
      </Link>
      <Link href="/gerant/stock" className="block text-blue-700 underline">
        Stock du dépôt
      </Link>
      <Link href="/gerant/ajustements" className="block text-blue-700 underline">
        Ajustements de stock
        {enAttente > 0 && (
          <span className="ml-2 rounded bg-orange-100 px-2 py-1 text-xs text-orange-700">
            {enAttente} à valider
          </span>
        )}
      </Link>
      <LogoutButton />
    </main>
  );
}