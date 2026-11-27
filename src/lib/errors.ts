import { NextResponse } from "next/server";

// Erreur métier : provoque l'annulation de la transaction en cours
export class Refus extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function reponseRefus(e: unknown): NextResponse {
  if (e instanceof Refus) {
    return NextResponse.json({ error: e.message }, { status: e.status });
  }
  // Erreur inattendue : on la journalise et on montre sa fin (utile en développement)
  console.error("[API] Erreur inattendue :", e);
  const detail =
    e instanceof Error
      ? e.message.split("\n").filter(Boolean).slice(-2).join(" ")
      : "erreur inconnue";
  return NextResponse.json({ error: `Erreur serveur : ${detail}` }, { status: 500 });
}