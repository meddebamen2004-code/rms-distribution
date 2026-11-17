import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import SecteurForm from "@/components/SecteurForm";
import ClientForm from "@/components/ClientForm";

export default async function ClientsPage() {
  await requireRole("GERANT");

  const secteurs = await prisma.secteur.findMany({
    orderBy: [{ ville: "asc" }, { nom: "asc" }],
  });
  const clients = await prisma.client.findMany({
    include: { secteur: true },
    orderBy: { nomCommerce: "asc" },
  });
  const options = secteurs.map((s) => ({ id: s.id, label: `${s.nom} (${s.ville})` }));

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link href="/gerant" className="text-blue-700 underline">
        ← Espace gérant
      </Link>
      <h1 className="text-2xl font-bold">Clients et secteurs</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">Secteurs</h2>
        <p className="text-gray-600">
          {options.map((s) => s.label).join(" · ") || "Aucun secteur"}
        </p>
        <SecteurForm />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Nouveau client</h2>
        <ClientForm secteurs={options} />
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">Clients ({clients.length})</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Commerce</th>
                <th className="p-2">Responsable</th>
                <th className="p-2">Téléphone</th>
                <th className="p-2">Adresse</th>
                <th className="p-2">Secteur</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="p-2">{c.nomCommerce}</td>
                  <td className="p-2">{c.responsable}</td>
                  <td className="p-2">{c.telephone}</td>
                  <td className="p-2">{c.adresse}</td>
                  <td className="p-2">
                    {c.secteur.nom} ({c.secteur.ville})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}