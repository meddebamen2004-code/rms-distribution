import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import SecteurForm from "@/components/SecteurForm";
import ClientModal from "@/components/ClientModal";
import ClientsTable, { type ClientRow } from "@/components/ClientsTable";

export default async function ClientsPage() {
  await requireRole("GERANT");

  const [secteurs, clients] = await Promise.all([
    prisma.secteur.findMany({ orderBy: [{ ville: "asc" }, { nom: "asc" }] }),
    prisma.client.findMany({ include: { secteur: true }, orderBy: { nomCommerce: "asc" } }),
  ]);

  const options = secteurs.map((s) => ({ id: s.id, label: `${s.nom} (${s.ville})` }));
  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    nomCommerce: c.nomCommerce,
    responsable: c.responsable,
    telephone: c.telephone,
    adresse: c.adresse,
    zone: `${c.secteur.nom} (${c.secteur.ville})`,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Portefeuille"
        title="Clients"
        subtitle="Retrouvez vos commerces et leur secteur de livraison."
        action={<ClientModal secteurs={options} />}
      />

      <ClientsTable rows={rows} zones={options.map((o) => o.label)} />

      <Card className="mt-6 p-6">
        <h2 className="text-base font-semibold text-slate-900">Secteurs</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((o) => (
            <Badge key={o.id} tone="blue">
              {o.label}
            </Badge>
          ))}
          {options.length === 0 && <p className="text-sm text-slate-500">Aucun secteur.</p>}
        </div>
        <div className="mt-4">
          <SecteurForm />
        </div>
      </Card>
    </>
  );
}