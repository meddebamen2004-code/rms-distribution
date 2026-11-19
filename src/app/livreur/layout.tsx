import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import Shell from "@/components/Shell";

export default async function LivreurLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("LIVREUR");
  const aCorriger = await prisma.bonChargement.count({
    where: { livreurId: user.id, statut: "REFUSE" },
  });
  return (
    <Shell
      roleLabel="Livreur"
      nav={NAV.LIVREUR}
      user={{ nom: user.nom }}
      badges={{ "/livreur/recharge": aCorriger }}
    >
      {children}
    </Shell>
  );
}