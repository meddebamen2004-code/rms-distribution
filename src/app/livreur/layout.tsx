import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import Shell from "@/components/Shell";

export default async function LivreurLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("LIVREUR");
  return (
    <Shell roleLabel="Livreur" nav={NAV.LIVREUR} user={{ nom: user.nom }}>
      {children}
    </Shell>
  );
}