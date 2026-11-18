import { requireRole } from "@/lib/auth";
import PageHeader from "@/components/ui/PageHeader";
import StockView from "@/components/StockView";

export default async function GerantStockPage() {
  await requireRole("GERANT");
  return (
    <>
      <PageHeader
        eyebrow="Dépôt"
        title="Stock du dépôt"
        subtitle="Consultation du stock et de l’historique des mouvements."
      />
      <StockView />
    </>
  );
}