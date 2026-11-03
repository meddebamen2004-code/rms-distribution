import { requireRole } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

export default async function LivreurPage() {
  const user = await requireRole("LIVREUR");
  return (
    <main className="mx-auto max-w-md space-y-3 px-4 pt-24">
      <h1 className="text-2xl font-bold">Espace livreur</h1>
      <p>Bonjour {user.nom}</p>
      <LogoutButton />
    </main>
  );
}