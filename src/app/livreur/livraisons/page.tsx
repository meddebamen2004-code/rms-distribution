import Link from "next/link";
import { FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { today } from "@/lib/dates";
import { clientsDuJour } from "@/lib/secteur";
import { stockCamionParProduit } from "@/lib/stock";
import { formatQuantite, MOTIFS_RETOUR } from "@/lib/format";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import AnnulerLivraisonButton from "@/components/AnnulerLivraisonButton";

const heure = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function resume(x: {
  quantiteLivree: number;
  quantiteRetour: number;
  motifRetour: string | null;
  produit: { nom: string; piecesParCarton: number };
}) {
  const ppc = x.produit.piecesParCarton;
  const parts: string[] = [];
  if (x.quantiteLivree > 0) parts.push(`livré ${formatQuantite(x.quantiteLivree, ppc)}`);
  if (x.quantiteRetour > 0) {
    parts.push(`retour ${formatQuantite(x.quantiteRetour, ppc)} (${MOTIFS_RETOUR[x.motifRetour ?? ""] ?? "motif ?"})`);
  }
  return `${x.produit.nom} : ${parts.join(" · ")}`;
}

export default async function LivraisonsPage() {
  const user = await requireRole("LIVREUR");

  const tournee = await prisma.tournee.findUnique({
    where: { livreurId_jour: { livreurId: user.id, jour: today() } },
  });

  if (!tournee) {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader eyebrow="Tournée du jour" title="Mes livraisons" />
        <Alert tone="yellow" title="Aucune tournée aujourd’hui">
          Votre demande de recharge doit d’abord être chargée par le magasinier.{" "}
          <Link href="/livreur/recharge" className="font-semibold underline">
            Voir ma demande
          </Link>
        </Alert>
      </div>
    );
  }
  if (tournee.statut !== "EN_COURS") {
    return (
      <div className="mx-auto max-w-lg">
        <PageHeader eyebrow="Tournée du jour" title="Mes livraisons" />
        <Alert tone="blue" title="Tournée clôturée">
          Plus aucune livraison n’est possible pour aujourd’hui.
        </Alert>
      </div>
    );
  }

  const [{ secteur, clients }, livraisons, stock] = await Promise.all([
    clientsDuJour(user.id),
    prisma.livraison.findMany({
      where: { tourneeId: tournee.id },
      include: { client: true, lignes: { include: { produit: true } } },
      orderBy: { dateHeure: "desc" },
    }),
    stockCamionParProduit(tournee.camionId),
  ]);
  const produits = await prisma.produit.findMany({
    where: { id: { in: [...stock.keys()] } },
    orderBy: { nom: "asc" },
  });
  const enCamion = produits.filter((p) => (stock.get(p.id) ?? 0) > 0);

  const nbParClient = new Map<number, number>();
  for (const l of livraisons) {
    if (!l.annulee) nbParClient.set(l.clientId, (nbParClient.get(l.clientId) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow="Tournée du jour" title="Mes livraisons" />

      {secteur && (
        <Card className="mb-6 border-blue-200 bg-blue-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Secteur du jour</p>
          <p className="mt-1 text-xl font-bold text-slate-900">{secteur.nom}</p>
          <p className="text-sm text-slate-600">{secteur.ville}</p>
        </Card>
      )}

      <h2 className="mb-3 text-base font-semibold text-slate-900">Mes clients ({clients.length})</h2>
      <ul className="mb-8 space-y-3">
        {clients.map((c) => {
          const n = nbParClient.get(c.id) ?? 0;
          return (
            <li key={c.id}>
              <Card className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{c.nomCommerce}</p>
                  <p className="truncate text-xs text-slate-500">{c.adresse}</p>
                  {n > 0 && (
                    <div className="mt-1">
                      <Badge tone="green">Livré {n > 1 ? `${n} fois` : ""}</Badge>
                    </div>
                  )}
                </div>
                <Link
                  href={`/livreur/livraisons/nouvelle?client=${c.id}`}
                  className="shrink-0 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Livrer
                </Link>
              </Card>
            </li>
          );
        })}
        {clients.length === 0 && <li className="text-sm text-slate-500">Aucun client dans ce secteur.</li>}
      </ul>

      <Card className="mb-8 p-5">
        <h2 className="mb-3 text-base font-semibold text-slate-900">Stock du camion</h2>
        <ul className="divide-y divide-slate-100">
          {enCamion.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span className="text-slate-700">{p.nom}</span>
              <span className="font-semibold text-slate-900">
                {formatQuantite(stock.get(p.id) ?? 0, p.piecesParCarton)}
              </span>
            </li>
          ))}
          {enCamion.length === 0 && <li className="py-2 text-sm text-slate-500">Le camion est vide.</li>}
        </ul>
      </Card>

      <h2 className="mb-3 text-base font-semibold text-slate-900">Livraisons du jour ({livraisons.length})</h2>
      <ul className="space-y-3">
        {livraisons.map((l) => (
          <li key={l.id}>
            <Card className={`p-4 ${l.annulee ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{l.client.nomCommerce}</p>
                  <p className="text-xs text-slate-500">{heure(l.dateHeure)}</p>
                </div>
                {l.annulee ? <Badge tone="red">Annulée</Badge> : <Badge tone="green">Livrée</Badge>}
              </div>
              <ul className="mt-2 space-y-1">
                {l.lignes.map((x) => (
                  <li key={x.id} className="text-sm text-slate-600">
                    {resume(x)}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center gap-4">
                <Link
                  href={`/livreur/livraisons/${l.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  <FileText size={14} /> Bon de livraison
                </Link>
                {!l.annulee && <AnnulerLivraisonButton id={l.id} client={l.client.nomCommerce} />}
              </div>
            </Card>
          </li>
        ))}
        {livraisons.length === 0 && <li className="text-sm text-slate-500">Aucune livraison pour l’instant.</li>}
      </ul>
    </div>
  );
}