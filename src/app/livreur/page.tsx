import { MapPin } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { clientsDuJour } from "@/lib/secteur";
import PageHeader from "@/components/ui/PageHeader";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";

export default async function LivreurPage() {
  const user = await requireRole("LIVREUR");
  const { secteur, clients } = await clientsDuJour(user.id);

  const date = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader eyebrow={date} title={`Bonjour ${user.nom.split(" ")[0]},`} />

      {secteur ? (
        <>
          <Card className="mb-6 border-blue-200 bg-blue-50 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
              Secteur du jour
            </p>
            <p className="mt-1 text-xl font-bold text-slate-900">{secteur.nom}</p>
            <p className="text-sm text-slate-600">{secteur.ville}</p>
          </Card>

          <h2 className="mb-3 text-base font-semibold text-slate-900">Mes clients ({clients.length})</h2>
          <ul className="space-y-3">
            {clients.map((c) => (
              <li key={c.id}>
                <Card className="p-4">
                  <p className="text-base font-semibold text-slate-900">{c.nomCommerce}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={14} /> {c.adresse}
                  </p>
                </Card>
              </li>
            ))}
            {clients.length === 0 && (
              <li className="text-sm text-slate-500">Aucun client dans ce secteur.</li>
            )}
          </ul>
        </>
      ) : (
        <Alert tone="yellow" title="Aucun secteur affecté aujourd’hui">
          Contactez le gérant pour connaître votre secteur.
        </Alert>
      )}
    </div>
  );
}