import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import Shell from "@/components/Shell";

export default async function GerantLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("GERANT");
  const [aValider, bonsAValider] = await Promise.all([
    prisma.ajustementStock.count({ where: { statut: "EN_ATTENTE" } }),
    prisma.bonChargement.count({ where: { statut: "CONTROLE" } }),
  ]);
  return (
    <Shell
      roleLabel="Gérant"
      nav={NAV.GERANT}
      user={{ nom: user.nom }}
      badges={{ "/gerant/ajustements": aValider, "/gerant/bons": bonsAValider }}
    >
      {children}
    </Shell>
  );
}