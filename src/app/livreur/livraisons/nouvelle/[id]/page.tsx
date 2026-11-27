import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { formatQuantite, MOTIFS_RETOUR } from "@/lib/format";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import { tdCls, thCls } from "@/components/ui/styles";
import PrintButton from "@/components/PrintButton";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default async function BonLivraisonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireRole("LIVREUR");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const l = await prisma.livraison.findUnique({
    where: { id },
    include: {
      client: { include: { secteur: true } },
      lignes: { include: { produit: true }, orderBy: { produit: { nom: "asc" } } },
      tournee: { include: { livreur: true } },
    },
  });
  if (!l || l.tournee.livreurId !== user.id) notFound();

  const total = l.lignes.reduce((s, x) => s + (x.quantiteLivree - x.quantiteRetour) * x.produit.prix, 0);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/livreur/livraisons" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600">
          <ChevronLeft size={16} /> Mes livraisons
        </Link>
        <PrintButton />
      </div>

      {l.annulee && (
        <div className="mb-4">
          <Alert title="Livraison annulée">Ce bon n’a plus de valeur : la livraison a été annulée.</Alert>
        </div>
      )}

      <Card className="p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">RMS Distribution</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Bon de livraison BL-{String(l.id).padStart(5, "0")}
            </h1>
            <p className="text-sm text-slate-500">{l.dateHeure.toLocaleString("fr-FR")}</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Livreur : {l.tournee.livreur.nom}</p>
            <p>Secteur : {l.client.secteur.nom} ({l.client.secteur.ville})</p>
          </div>
        </div>

        <div className="border-b border-slate-200 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Client</p>
          <p className="mt-1 font-semibold text-slate-900">{l.client.nomCommerce}</p>
          <p className="text-sm text-slate-600">
            {l.client.responsable} · {l.client.telephone}
          </p>
          <p className="text-sm text-slate-600">{l.client.adresse}</p>
        </div>

        <div className="overflow-x-auto py-4">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className={thCls}>Produit</th>
                <th className={thCls}>Livré</th>
                <th className={thCls}>Retourné</th>
                <th className={thCls}>Prix unit.</th>
                <th className={thCls}>Montant HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {l.lignes.map((x) => (
                <tr key={x.id}>
                  <td className={`${tdCls} font-semibold text-slate-900`}>
                    {x.produit.nom}
                    <span className="block text-xs font-normal text-slate-500">{x.produit.reference}</span>
                  </td>
                  <td className={tdCls}>
                    {x.quantiteLivree > 0 ? formatQuantite(x.quantiteLivree, x.produit.piecesParCarton) : "-"}
                  </td>
                  <td className={tdCls}>
                    {x.quantiteRetour > 0 ? (
                      <>
                        {formatQuantite(x.quantiteRetour, x.produit.piecesParCarton)}
                        <span className="block text-xs text-slate-500">
                          {MOTIFS_RETOUR[x.motifRetour ?? ""] ?? ""}
                        </span>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className={tdCls}>{euro.format(x.produit.prix)}</td>
                  <td className={tdCls}>{euro.format((x.quantiteLivree - x.quantiteRetour) * x.produit.prix)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4">
          <p className="text-lg font-bold text-slate-900">Total HT : {euro.format(total)}</p>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-8 text-sm text-slate-500">
          <div className="h-24 rounded-xl border border-dashed border-slate-300 p-3">Signature du livreur</div>
          <div className="h-24 rounded-xl border border-dashed border-slate-300 p-3">Signature du client</div>
        </div>
      </Card>
    </div>
  );
}