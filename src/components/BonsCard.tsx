import Link from "next/link";
import Card from "@/components/ui/Card";
import StatutBon from "@/components/StatutBon";
import { tdCls, thCls } from "@/components/ui/styles";
import { labelJour } from "@/lib/dates";
import type { BonListe } from "@/lib/bons";

export default function BonsCard({
  titre,
  bons,
  basePath,
  vide,
}: {
  titre: string;
  bons: BonListe[];
  basePath: string;
  vide: string;
}) {
  return (
    <Card className="mb-6 overflow-hidden">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-base font-semibold text-slate-900">
          {titre} ({bons.length})
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className={thCls}>Tournée du</th>
              <th className={thCls}>Livreur</th>
              <th className={thCls}>Lignes</th>
              <th className={thCls}>Statut</th>
              <th className={thCls}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bons.map((b) => (
              <tr key={b.id}>
                <td className={`${tdCls} font-semibold text-slate-900`}>{labelJour(b.jour)}</td>
                <td className={tdCls}>{b.livreur.nom}</td>
                <td className={tdCls}>{b._count.lignes}</td>
                <td className={tdCls}>
                  <StatutBon statut={b.statut} />
                </td>
                <td className={tdCls}>
                  <Link href={`${basePath}/${b.id}`} className="text-xs font-semibold text-blue-600 hover:underline">
                    Ouvrir
                  </Link>
                </td>
              </tr>
            ))}
            {bons.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                  {vide}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}