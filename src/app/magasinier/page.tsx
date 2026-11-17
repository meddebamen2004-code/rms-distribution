import Link from "next/link";
import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function MagasinierPage() {
  const user = await requireRole("MAGASINIER");
  return (
    <main className="mx-auto max-w-md space-y-3 px-4 pt-24">
      <h1 className="text-2xl font-bold">Espace magasinier</h1>
      <p>Bonjour {user.nom}</p>
      <Link href="/magasinier/stock" className="block text-blue-700 underline">
        Stock du dépôt et réceptions
      </Link>
            <Link href="/magasinier/ajustements" className="block text-blue-700 underline">
        Ajustements de stock
      </Link>
      <LogoutButton />
    </main>
  );
}