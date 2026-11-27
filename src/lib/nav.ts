import type { Role } from "./roles";

export type IconName =
  | "dashboard"
  | "package"
  | "users"
  | "calendar"
  | "warehouse"
  | "sliders"
  | "truck"
  | "clipboard";
export type NavItem = { href: string; label: string; icon: IconName };

export const NAV: Record<Role, NavItem[]> = {
  GERANT: [
    { href: "/gerant", label: "Tableau de bord", icon: "dashboard" },
    { href: "/gerant/produits", label: "Produits", icon: "package" },
    { href: "/gerant/clients", label: "Clients et secteurs", icon: "users" },
    { href: "/gerant/planning", label: "Planning", icon: "calendar" },
    { href: "/gerant/stock", label: "Stock du dépôt", icon: "warehouse" },
    { href: "/gerant/ajustements", label: "Ajustements", icon: "sliders" },
    { href: "/gerant/bons", label: "Demandes de recharge", icon: "truck" },
  ],
  MAGASINIER: [
    { href: "/magasinier", label: "Accueil", icon: "dashboard" },
    { href: "/magasinier/stock", label: "Stock et réceptions", icon: "warehouse" },
    { href: "/magasinier/ajustements", label: "Ajustements", icon: "sliders" },
    { href: "/magasinier/bons", label: "Demandes de recharge", icon: "truck" },
  ],
  LIVREUR: [
    { href: "/livreur", label: "Ma journée", icon: "dashboard" },
    { href: "/livreur/livraisons", label: "Mes livraisons", icon: "clipboard" },
    { href: "/livreur/recharge", label: "Ma demande de recharge", icon: "truck" },
  ],
};