import type { ReactNode } from "react";
import { requireRole } from "@/lib/auth";
import { NAV } from "@/lib/nav";
import Shell from "@/components/Shell";

export default async function MagasinierLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("MAGASINIER");
  return (
    <Shell roleLabel="Magasinier" nav={NAV.MAGASINIER} user={{ nom: user.nom }}>
      {children}
    </Shell>
  );
}