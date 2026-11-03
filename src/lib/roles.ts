export const ROLES = ["GERANT", "MAGASINIER", "LIVREUR"] as const;
export type Role = (typeof ROLES)[number];

// Page d'accueil de chaque rôle
export const HOME_BY_ROLE: Record<Role, string> = {
  GERANT: "/gerant",
  MAGASINIER: "/magasinier",
  LIVREUR: "/livreur",
};