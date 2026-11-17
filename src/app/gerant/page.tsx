import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { stockParProduit } from "@/lib/stock";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

function StatCard({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: string | number;
  hint?: string;
  href?: string;
}) {
  const body = (
    <Card className="p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </Card>
  );
  return href ? (
    <Link href={href} className="block transition hover:opacity-90">
      {body}
    </Link>
  ) : (
    body
  );
}

export default async function GerantPage() {
  const user = await requireRole("GERANT");

  const [produits, stock, aValider] = await Promise.all([
    prisma.produit.findMany({ where: { archive: false }, orderBy: { nom: "asc" } }),
    stockParProduit(),
    prisma.ajustementStock.count({ where: { statut: "EN_ATTENTE" } }),
  ]);

  const valeur = produits.reduce((s, p) => s + (stock.get(p.id) ?? 0) * p.prix, 0);
  const sousSeuil = produits.filter((p) => (stock.get(p.id) ?? 0) < p.seuilMin);

  return (
    <>
      <PageHeader
        eyebrow="Vue d’ensemble"
        title={`Bonjour ${user.nom.split(" ")[0]},`}
        subtitle="Voici l’activité de votre dépôt."
      />

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Valeur du stock" value={euro.format(valeur)} hint="Prix unitaire × pièces en dépôt" />
        <StatCard
          label="Produits sous le seuil"
          value={sousSeuil.length}
          hint="À réapprovisionner"
          href="/gerant/stock"
        />
        <StatCard
          label="Ajustements à valider"
          value={aValider}
          hint="Demandes du magasinier"
          href="/gerant/ajustements"
        />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold text-slate-900">Alertes</h2>
        <p className="text-sm text-slate-500">Stocks sous le seuil minimum</p>
        <ul className="mt-4 divide-y divide-slate-100">
          {sousSeuil.slice(0, 5).map((p) => (
            <li key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{p.nom}</p>
                <p className="text-xs text-slate-500">{p.reference}</p>
              </div>
              <Badge tone="red">
                {stock.get(p.id) ?? 0} / {p.seuilMin} pièces
              </Badge>
            </li>
          ))}
          {sousSeuil.length === 0 && (
            <li className="py-3 text-sm text-slate-500">Aucune alerte : tous les stocks sont au-dessus du seuil.</li>
          )}
        </ul>
      </Card>
    </>
  );
}