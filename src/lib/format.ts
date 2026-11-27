// 53 pièces avec 24 pièces par carton -> "2 cartons + 5 p."
export function formatQuantite(total: number, parCarton: number): string {
  const cartons = Math.floor(total / parCarton);
  const pieces = total - cartons * parCarton;
  if (cartons === 0) return `${pieces} p.`;
  if (pieces === 0) return `${cartons} carton${cartons > 1 ? "s" : ""}`;
  return `${cartons} carton${cartons > 1 ? "s" : ""} + ${pieces} p.`;
}
export const MOTIFS_RETOUR: Record<string, string> = {
  ABIME: "Produit abîmé",
  REFUSE: "Produit refusé",
  PERIME: "Produit périmé",
};