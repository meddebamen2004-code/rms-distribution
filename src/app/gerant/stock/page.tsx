import Link from "next/link";
import { requireRole } from "@/lib/auth";
import StockView from "@/components/StockView";

export default async function GerantStockPage() {
  await requireRole("GERANT");
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Link href="/gerant" className="text-blue-700 underline">
        ← Espace gérant
      </Link>
      <h1 className="text-2xl font-bold">Stock du dépôt</h1>
      <StockView />
    </main>
  );
}