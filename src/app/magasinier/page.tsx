import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function MagasinierPage() {
  const user = await requireRole("MAGASINIER");
  return (
    <main className="mx-auto max-w-md space-y-3 px-4 pt-24">
      <h1 className="text-2xl font-bold">Espace magasinier</h1>
      <p>Bonjour {user.nom}</p>
      <LogoutButton />
    </main>
  );
}