import { z } from "zod";
import { ROLES } from "./roles";

export const loginSchema = z.object({
  identifiant: z.string().trim().toLowerCase().min(1, "Identifiant requis"),
  motDePasse: z.string().min(1, "Mot de passe requis"),
});

// Utilisé par le gérant pour créer un compte
export const createUserSchema = z.object({
  nom: z.string().trim().min(2, "Nom : 2 caractères minimum"),
  identifiant: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Identifiant : 3 caractères minimum"),
  motDePasse: z.string().min(8, "Mot de passe : 8 caractères minimum"),
  role: z.enum(ROLES, { message: "Rôle invalide" }),
});

export const categorieSchema = z.object({
  nom: z.string().trim().min(2, "Nom de catégorie : 2 caractères minimum"),
});

export const produitSchema = z.object({
  reference: z.string().trim().min(1, "Référence requise"),
  nom: z.string().trim().min(1, "Nom requis"),
  prix: z.coerce.number().positive("Le prix doit être positif"),
  piecesParCarton: z.coerce
    .number()
    .int("Nombre entier requis")
    .min(1, "Au moins 1 pièce par carton"),
  seuilMin: z.coerce.number().int("Nombre entier requis").min(0, "Seuil : 0 minimum"),
  datePeremption: z
    .string()
    .optional()
    .transform((v) => (v ? new Date(v) : null))
    .refine((d) => d === null || !isNaN(d.getTime()), "Date invalide"),
  categorieId: z.coerce.number().int().positive("Catégorie requise"),
});

export const produitUpdateSchema = produitSchema
  .partial()
  .extend({ archive: z.boolean().optional() });
  export const secteurSchema = z.object({
  nom: z.string().trim().min(2, "Nom du secteur : 2 caractères minimum"),
  ville: z.string().trim().min(2, "Ville : 2 caractères minimum"),
});

export const clientSchema = z.object({
  nomCommerce: z.string().trim().min(1, "Nom du commerce requis"),
  responsable: z.string().trim().min(1, "Responsable requis"),
  telephone: z.string().trim().min(6, "Téléphone invalide"),
  adresse: z.string().trim().min(1, "Adresse requise"),
  secteurId: z.coerce.number().int().positive("Secteur requis"),
});

export const affectationSchema = z.object({
  livreurId: z.coerce.number().int().positive("Livreur requis"),
  secteurId: z.coerce.number().int().positive("Secteur requis"),
  jour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
});

export const receptionSchema = z.object({
  reference: z.string().trim().optional(),
  lignes: z
    .array(
      z.object({
        produitId: z.coerce.number().int().positive("Produit requis"),
        cartons: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
        pieces: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
      })
    )
    .min(1, "Ajoutez au moins une ligne"),
});

export const ajustementSchema = z.object({
  produitId: z.coerce.number().int().positive("Produit requis"),
  sens: z.enum(["AJOUT", "RETRAIT"], { message: "Sens invalide" }),
  cartons: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
  pieces: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
  motif: z.string().trim().min(5, "Motif obligatoire (5 caractères minimum)"),
});

export const decisionAjustementSchema = z
  .object({
    decision: z.enum(["VALIDER", "REFUSER"], { message: "Décision invalide" }),
    commentaire: z.string().trim().optional(),
  })
  .refine(
    (d) => d.decision === "VALIDER" || (d.commentaire && d.commentaire.length >= 3),
    { message: "Un commentaire est obligatoire pour refuser", path: ["commentaire"] }
  );

  const ligneBonSchema = z.object({
  produitId: z.coerce.number().int().positive("Produit requis"),
  cartons: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
  pieces: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
});

export const bonSchema = z.object({
  jour: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide"),
  lignes: z.array(ligneBonSchema).min(1, "Ajoutez au moins une ligne"),
  envoyer: z.boolean().optional(),
});

export const bonUpdateSchema = bonSchema.omit({ jour: true });

export const bonActionSchema = z.object({
  action: z.enum(["ENVOYER", "SOUMETTRE", "REFUSER", "VALIDER", "RENVOYER", "CHARGER"], {
    message: "Action invalide",
  }),
  commentaire: z.string().trim().optional(),
});

export const ligneDecisionSchema = z.object({
  decision: z.enum(["ACCEPTEE", "REJETEE"], { message: "Décision invalide" }),
  quantiteAccordee: z.coerce.number().int("Nombre entier requis").min(0).optional(),
  motif: z.string().trim().optional(),
});

export const livraisonSchema = z.object({
  clientId: z.coerce.number().int().positive("Client requis"),
  lignes: z
    .array(
      z.object({
        produitId: z.coerce.number().int().positive("Produit requis"),
        quantiteLivree: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
        quantiteRetour: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
        motifRetour: z.enum(["ABIME", "REFUSE", "PERIME"]).nullish(),
      })
    )
    .min(1, "Ajoutez au moins un produit"),
});

export const livraisonActionSchema = z.object({
  action: z.literal("ANNULER", { message: "Action invalide" }),
});

export const verificationSchema = z.object({
  reelles: z.array(
    z.object({
      produitId: z.coerce.number().int().positive("Produit requis"),
      quantiteReelle: z.coerce.number().int("Nombre entier requis").min(0, "Quantité négative interdite"),
      motif: z.enum(["CASSE", "ERREUR_LIVRAISON", "PRODUIT_MANQUANT", "AUTRE"]).nullish(),
      commentaire: z.string().trim().nullish(),
    })
  ),
});

export const decisionEcartSchema = z.object({
  decision: z.enum(["ACCEPTER", "DEMANDER_EXPLICATION"], { message: "Décision invalide" }),
  commentaire: z.string().trim().optional(),
});

export const explicationSchema = z.object({
  commentaire: z.string().trim().min(3, "Expliquez l'écart (3 caractères minimum)"),
  motif: z.enum(["CASSE", "ERREUR_LIVRAISON", "PRODUIT_MANQUANT", "AUTRE"]).optional(),
});

export const tourneeActionSchema = z.object({
  action: z.literal("DECHARGER", { message: "Action invalide" }),
});