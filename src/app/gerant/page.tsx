import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import Link from "next/link"

export default async function GerantPage() {
  const user = await requireRole("GERANT");
  return (
    <main className="mx-auto max-w-md space-y-3 px-4 pt-24">
      <h1 className="text-2xl font-bold">Espace gérant</h1>
      <p>Bonjour {user.nom}</p>
      <Link href="/gerant/produits" className="block text-blue-700 underline">Gérer les produits</Link>
      <LogoutButton />
    </main>
  );
}