import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { addDays, isValidISODate, labelJour, mondayOf, today } from "@/lib/dates";
import PlanningCell from "@/components/PlanningCell";

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ debut?: string }>;
}) {
  await requireRole("GERANT");

  const { debut } = await searchParams;
  const lundi = mondayOf(debut && isValidISODate(debut) ? debut : today());
  const jours = Array.from({ length: 7 }, (_, i) => addDays(lundi, i));

  const [livreurs, secteurs, affectations] = await Promise.all([
    prisma.utilisateur.findMany({
      where: { role: "LIVREUR", actif: true },
      orderBy: { nom: "asc" },
    }),
    prisma.secteur.findMany({ orderBy: [{ ville: "asc" }, { nom: "asc" }] }),
    prisma.affectation.findMany({ where: { jour: { in: jours } } }),
  ]);
  const options = secteurs.map((s) => ({ id: s.id, label: `${s.nom} (${s.ville})` }));
  const parLivreurJour = new Map(
    affectations.map((a) => [`${a.livreurId}|${a.jour}`, a.secteurId])
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <Link href="/gerant" className="text-blue-700 underline">
        ← Espace gérant
      </Link>
      <h1 className="text-2xl font-bold">Planning des livreurs</h1>

      <div className="flex items-center gap-4">
        <Link href={`/gerant/planning?debut=${addDays(lundi, -7)}`} className="text-blue-700 underline">
          ← Semaine précédente
        </Link>
        <span className="font-semibold">Semaine du {labelJour(lundi)}</span>
        <Link href={`/gerant/planning?debut=${addDays(lundi, 7)}`} className="text-blue-700 underline">
          Semaine suivante →
        </Link>
      </div>

      {options.length === 0 ? (
        <p className="text-orange-600">Créez d'abord des secteurs (page Clients et secteurs).</p>
      ) : livreurs.length === 0 ? (
        <p className="text-orange-600">Aucun livreur actif.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Livreur</th>
                {jours.map((j) => (
                  <th key={j} className={j === today() ? "p-2 text-blue-700" : "p-2"}>
                    {labelJour(j)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {livreurs.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="p-2 font-medium">{l.nom}</td>
                  {jours.map((j) => (
                    <td key={j} className="p-1">
                      <PlanningCell
                        livreurId={l.id}
                        jour={j}
                        secteurId={parLivreurJour.get(`${l.id}|${j}`) ?? null}
                        secteurs={options}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}