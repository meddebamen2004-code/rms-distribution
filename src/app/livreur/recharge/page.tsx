import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { stockParProduit } from "@/lib/stock";
import { addDays, isValidISODate, labelJour, today } from "@/lib/dates";
import { BON_INCLUDE } from "@/lib/bons";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import StatutBon from "@/components/StatutBon";
import BonDetail from "@/components/BonDetail";
import BonEditor from "@/components/BonEditor";

const INFOS: Record<string, string> = {
  ENVOYE: "Votre demande est en cours de contrôle par le magasinier.",
  CONTROLE: "Le magasinier a terminé son contrôle : le gérant doit maintenant valider.",
  VALIDE: "Demande validée : le magasinier va charger votre camion.",
  CHARGE: "Camion chargé. Bonne tournée !",
};

export default async function RechargePage({
  searchParams,
}: {
  searchParams: Promise<{ jour?: string }>;
}) {
  const user = await requireRole("LIVREUR");
  const { jour: jourParam } = await searchParams;
  const jour =
    jourParam && isValidISODate(jourParam) && jourParam >= today() ? jourParam : addDays(today(), 1);

  const [bon, bons, produits, stock] = await Promise.all([
    prisma.bonChargement.findUnique({
      where: { livreurId_jour: { livreurId: user.id, jour } },
      include: BON_INCLUDE,
    }),
    prisma.bonChargement.findMany({
      where: { livreurId: user.id },
      orderBy: { jour: "desc" },
      take: 8,
    }),
    prisma.produit.findMany({ where: { archive: false }, orderBy: { nom: "asc" } }),
    stockParProduit(),
  ]);

  const modifiable = !bon || bon.statut === "BROUILLON" || bon.statut === "REFUSE";
  const dansBon = new Set(bon?.lignes.map((l) => l.produitId) ?? []);
  const options = produits
    .filter((p) => (stock.get(p.id) ?? 0) > 0 || dansBon.has(p.id))
    .map((p) => ({
      id: p.id,
      nom: p.nom,
      reference: p.reference,
      piecesParCarton: p.piecesParCarton,
      stock: stock.get(p.id) ?? 0,
    }));
  const initial: Record<number, number> = {};
  const retours: Record<number, { decision: string; motif: string | null }> = {};
  for (const l of bon?.lignes ?? []) {
    initial[l.produitId] = l.quantiteDemandee;
    if (bon?.statut === "REFUSE") retours[l.produitId] = { decision: l.decision, motif: l.motif };
  }

  const jours = [0, 1, 2, 3].map((i) => addDays(today(), i));

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        eyebrow="Chargement"
        title="Ma demande de recharge"
        subtitle={`Pour la tournée du ${labelJour(jour)}`}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {jours.map((j, i) => (
          <Link
            key={j}
            href={`/livreur/recharge?jour=${j}`}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              j === jour
                ? "bg-blue-600 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {i === 0 ? "Aujourd’hui" : i === 1 ? "Demain" : labelJour(j)}
          </Link>
        ))}
      </div>

      {bon?.statut === "REFUSE" && (
        <div className="mb-4">
          <Alert title="Demande refusée par le magasinier">
            {bon.commentaire ?? "Corrigez votre demande puis renvoyez-la."}
          </Alert>
        </div>
      )}
      {bon?.statut === "ENVOYE" && bon.commentaire && (
        <div className="mb-4">
          <Alert tone="yellow" title="Le gérant a demandé une nouvelle vérification">
            {bon.commentaire}
          </Alert>
        </div>
      )}

      {modifiable ? (
        <BonEditor
          key={bon?.id ?? "nouveau"}
          jour={jour}
          bonId={bon?.id ?? null}
          produits={options}
          initial={initial}
          retours={retours}
        />
      ) : (
        <div className="space-y-4">
          {bon && INFOS[bon.statut] && <Alert tone="blue" title={INFOS[bon.statut]} />}
          {bon && <BonDetail bon={bon} />}
        </div>
      )}

      {bons.length > 0 && (
        <Card className="mt-8 p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-900">Mes dernières demandes</h2>
          <ul className="divide-y divide-slate-100">
            {bons.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/livreur/recharge?jour=${b.jour}`}
                  className="flex items-center justify-between py-3 text-sm hover:opacity-80"
                >
                  <span className="font-medium text-slate-900">{labelJour(b.jour)}</span>
                  <StatutBon statut={b.statut} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}