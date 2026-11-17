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