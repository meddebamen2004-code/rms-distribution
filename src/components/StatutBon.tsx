import Badge from "@/components/ui/Badge";

const STATUTS = {
  BROUILLON: { label: "Brouillon", tone: "gray" },
  ENVOYE: { label: "Envoyé", tone: "orange" },
  CONTROLE: { label: "Contrôlé", tone: "blue" },
  VALIDE: { label: "Validé", tone: "green" },
  CHARGE: { label: "Chargé", tone: "green" },
  REFUSE: { label: "Refusé", tone: "red" },
} as const;

const DECISIONS = {
  EN_ATTENTE: { label: "À traiter", tone: "orange" },
  ACCEPTEE: { label: "Accepté", tone: "green" },
  REJETEE: { label: "Rejeté", tone: "red" },
} as const;

export default function StatutBon({ statut }: { statut: string }) {
  const s = STATUTS[statut as keyof typeof STATUTS];
  return <Badge tone={s?.tone ?? "gray"}>{s?.label ?? statut}</Badge>;
}

export function DecisionBadge({ decision }: { decision: string }) {
  const d = DECISIONS[decision as keyof typeof DECISIONS];
  return <Badge tone={d?.tone ?? "gray"}>{d?.label ?? decision}</Badge>;
}