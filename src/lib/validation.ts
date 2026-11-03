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