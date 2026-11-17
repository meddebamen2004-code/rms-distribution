const STYLES: Record<string, { label: string; cls: string }> = {
  EN_ATTENTE: { label: "En attente", cls: "bg-orange-100 text-orange-700" },
  VALIDE: { label: "Validé", cls: "bg-green-100 text-green-700" },
  REFUSE: { label: "Refusé", cls: "bg-red-100 text-red-700" },
};

export default function StatutAjustement({ statut }: { statut: string }) {
  const s = STYLES[statut] ?? { label: statut, cls: "bg-gray-100 text-gray-700" };
  return <span className={`rounded px-2 py-1 text-xs ${s.cls}`}>{s.label}</span>;
}