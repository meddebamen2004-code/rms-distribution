import Badge from "@/components/ui/Badge";

const STATUTS = {
  EN_ATTENTE: { label: "En attente", tone: "orange" },
  VALIDE: { label: "Validé", tone: "green" },
  REFUSE: { label: "Refusé", tone: "red" },
} as const;

export default function StatutAjustement({ statut }: { statut: string }) {
  const s = STATUTS[statut as keyof typeof STATUTS];
  return <Badge tone={s?.tone ?? "gray"}>{s?.label ?? statut}</Badge>;
}