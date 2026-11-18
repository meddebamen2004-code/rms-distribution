import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { addDays, isValidISODate, labelJour, mondayOf, today } from "@/lib/dates";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { thCls } from "@/components/ui/styles";
import PlanningCell from "@/components/PlanningCell";

const navBtn =
  "inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50";

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
  const parLivreurJour = new Map(affectations.map((a) => [`${a.livreurId}|${a.jour}`, a.secteurId]));

  return (
    <>
      <PageHeader
        eyebrow="Organisation"
        title="Planning des livreurs"
        subtitle="Affectez chaque livreur à un secteur pour chaque jour."
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href={`/gerant/planning?debut=${addDays(lundi, -7)}`} className={navBtn}>
          <ChevronLeft size={16} /> Semaine précédente
        </Link>
        <span className="text-sm font-semibold text-slate-900">Semaine du {labelJour(lundi)}</span>
        <Link href={`/gerant/planning?debut=${addDays(lundi, 7)}`} className={navBtn}>
          Semaine suivante <ChevronRight size={16} />
        </Link>
      </div>

      {options.length === 0 ? (
        <Alert tone="yellow" title="Aucun secteur">
          Créez d’abord des secteurs dans la page Clients.
        </Alert>
      ) : livreurs.length === 0 ? (
        <Alert tone="yellow" title="Aucun livreur actif" />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className={thCls}>Livreur</th>
                {jours.map((j) => (
                  <th key={j} className={`${thCls} ${j === today() ? "!text-blue-600" : ""}`}>
                    {labelJour(j)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {livreurs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 text-sm font-semibold text-slate-900">{l.nom}</td>
                  {jours.map((j) => (
                    <td key={j} className="min-w-40 p-2">
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
        </Card>
      )}
    </>
  );
}