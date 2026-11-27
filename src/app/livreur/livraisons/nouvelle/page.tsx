import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { today } from "@/lib/dates";
import { clientsDuJour } from "@/lib/secteur";
import { stockCamionParProduit } from "@/lib/stock";
import PageHeader from "@/components/ui/PageHeader";
import Alert from "@/components/ui/Alert";
import LivraisonEditor from "@/components/LivraisonEditor";

export default async function NouvelleLivraisonPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>;
}) {
  const user = await requireRole("LIVREUR");
  const clientId = Number((await searchParams).client);
  if (!Number.isInteger(clientId)) notFound();

  const tournee = await prisma.tournee.findUnique({
    where: { livreurId_jour: { livreurId: user.id, jour: today() } },
  });
  if (!tournee || tournee.statut !== "EN_COURS") redirect("/livreur/livraisons");

  // Le client doit appartenir au secteur du jour (sinon : introuvable)
  const { secteur, clients } = await clientsDuJour(user.id);
  const client = clients.find((c) => c.id === clientId);
  if (!secteur || !client) notFound();

  const stock = await stockCamionParProduit(tournee.camionId);
  const produits = await prisma.produit.findMany({
    where: { id: { in: [...stock.keys()] } },
    orderBy: { nom: "asc" },
  });
  const options = produits
    .map((p) => ({
      id: p.id,
      nom: p.nom,
      reference: p.reference,
      piecesParCarton: p.piecesParCarton,
      stock: stock.get(p.id) ?? 0,
    }))
    .filter((p) => p.stock > 0);

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/livreur/livraisons" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
        <ChevronLeft size={16} /> Mes livraisons
      </Link>
      <PageHeader eyebrow="Nouvelle livraison" title={client.nomCommerce} subtitle={client.adresse} />

      {options.length === 0 ? (
        <Alert tone="yellow" title="Le camion est vide">
          Il ne reste plus aucun produit à livrer.
        </Alert>
      ) : (
        <LivraisonEditor clientId={client.id} produits={options} />
      )}
    </div>
  );
}