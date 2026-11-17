import { requireRole } from "@/lib/auth";
import { clientsDuJour } from "@/lib/secteur";
import LogoutButton from "@/components/LogoutButton";

export default async function LivreurPage() {
  const user = await requireRole("LIVREUR");
  const { secteur, clients } = await clientsDuJour(user.id);

  return (
    <main className="mx-auto max-w-md space-y-4 px-4 pt-16">
      <h1 className="text-2xl font-bold">Espace livreur</h1>
      <p>Bonjour {user.nom}</p>

      {secteur ? (
        <section className="space-y-2">
          <p className="rounded bg-blue-50 p-3 text-blue-900">
            Secteur du jour : <strong>{secteur.nom}</strong> ({secteur.ville})
          </p>
          <h2 className="font-semibold">Mes clients ({clients.length})</h2>
          <ul className="space-y-2">
            {clients.map((c) => (
              <li key={c.id} className="rounded border p-3">
                <p className="font-medium">{c.nomCommerce}</p>
                <p className="text-sm text-gray-600">{c.adresse}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p className="rounded bg-orange-50 p-3 text-orange-700">
          Aucun secteur affecté aujourd'hui. Contactez le gérant.
        </p>
      )}

      <LogoutButton />
    </main>
  );
}