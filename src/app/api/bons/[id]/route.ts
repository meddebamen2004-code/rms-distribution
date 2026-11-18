import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { bonActionSchema, bonUpdateSchema } from "@/lib/validation";
import { chargerBon, preparerLignes } from "@/lib/chargement";
import { Refus, reponseRefus } from "@/lib/errors";

// Qui peut faire quoi, et depuis quel statut
const TRANSITIONS: Record<string, { roles: string[]; from: string[]; commentaireObligatoire?: boolean }> = {
  ENVOYER: { roles: ["LIVREUR"], from: ["BROUILLON", "REFUSE"] },
  SOUMETTRE: { roles: ["MAGASINIER"], from: ["ENVOYE"] },
  REFUSER: { roles: ["MAGASINIER"], from: ["ENVOYE"], commentaireObligatoire: true },
  VALIDER: { roles: ["GERANT"], from: ["CONTROLE"] },
  RENVOYER: { roles: ["GERANT"], from: ["CONTROLE"], commentaireObligatoire: true },
  CHARGER: { roles: ["MAGASINIER"], from: ["VALIDE"] },
};

type Ctx = { params: Promise<{ id: string }> };

// Le livreur corrige son bon (seulement en brouillon ou refusé)
export async function PUT(req: Request, { params }: Ctx) {
  const auth = await requireApiRole("LIVREUR");
  if ("error" in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = bonUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { lignes, envoyer } = parsed.data;

  try {
    const bon = await prisma.$transaction(async (tx) => {
      const b = await tx.bonChargement.findUnique({ where: { id } });
      if (!b || b.livreurId !== auth.user.id) throw new Refus(404, "Bon introuvable");
      if (!["BROUILLON", "REFUSE"].includes(b.statut)) {
        throw new Refus(409, "Ce bon n'est plus modifiable");
      }
      const data = await preparerLignes(lignes, tx);
      await tx.ligneChargement.deleteMany({ where: { bonId: id } });
      return tx.bonChargement.update({
        where: { id },
        data: {
          statut: envoyer ? "ENVOYE" : "BROUILLON",
          envoyeLe: envoyer ? new Date() : null,
          commentaire: envoyer ? null : undefined,
          lignes: { create: data },
        },
        include: { lignes: true },
      });
    });
    return NextResponse.json(bon);
  } catch (e) {
    return reponseRefus(e);
  }
}

// Les étapes du circuit : envoyer, soumettre, refuser, valider, renvoyer, charger
export async function PATCH(req: Request, { params }: Ctx) {
  const auth = await requireApiRole("LIVREUR", "MAGASINIER", "GERANT");
  if ("error" in auth) return auth.error;

  const id = Number((await params).id);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 });
  }
  const body = await req.json().catch(() => null);
  const parsed = bonActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { action, commentaire } = parsed.data;
  const t = TRANSITIONS[action];
  if (!t.roles.includes(auth.user.role)) {
    return NextResponse.json({ error: "Action non autorisée pour votre rôle" }, { status: 403 });
  }

  try {
    const resultat = await prisma.$transaction(async (tx) => {
      const bon = await tx.bonChargement.findUnique({
        where: { id },
        include: { lignes: { include: { produit: true } } },
      });
      if (!bon || (auth.user.role === "LIVREUR" && bon.livreurId !== auth.user.id)) {
        throw new Refus(404, "Bon introuvable");
      }
      if (!t.from.includes(bon.statut)) {
        throw new Refus(409, `Action impossible : le bon est au statut « ${bon.statut} »`);
      }
      if (t.commentaireObligatoire && (!commentaire || commentaire.length < 3)) {
        throw new Refus(400, "Un commentaire est obligatoire");
      }
      const maintenant = new Date();

      switch (action) {
        case "ENVOYER":
          if (bon.lignes.length === 0) {
            throw new Refus(400, "Ajoutez au moins une ligne avant d'envoyer");
          }
          await tx.ligneChargement.updateMany({
            where: { bonId: id },
            data: { decision: "EN_ATTENTE", quantiteAccordee: null, motif: null },
          });
          return tx.bonChargement.update({
            where: { id },
            data: { statut: "ENVOYE", envoyeLe: maintenant, commentaire: null },
          });

        case "SOUMETTRE":
          if (bon.lignes.some((l) => l.decision === "EN_ATTENTE")) {
            throw new Refus(409, "Toutes les lignes doivent être acceptées ou rejetées");
          }
          if (!bon.lignes.some((l) => l.decision === "ACCEPTEE")) {
            throw new Refus(409, "Toutes les lignes sont rejetées : refusez le bon");
          }
          return tx.bonChargement.update({
            where: { id },
            data: { statut: "CONTROLE", controleParId: auth.user.id, controleLe: maintenant },
          });

        case "REFUSER":
          return tx.bonChargement.update({
            where: { id },
            data: { statut: "REFUSE", commentaire, controleParId: auth.user.id, controleLe: maintenant },
          });

        case "VALIDER":
          return tx.bonChargement.update({
            where: { id },
            data: { statut: "VALIDE", valideParId: auth.user.id, valideLe: maintenant },
          });

        case "RENVOYER":
          return tx.bonChargement.update({
            where: { id },
            data: { statut: "ENVOYE", commentaire },
          });

        default:
          return chargerBon(tx, bon, auth.user.id);
      }
    });
    return NextResponse.json(resultat);
  } catch (e) {
    return reponseRefus(e);
  }
}