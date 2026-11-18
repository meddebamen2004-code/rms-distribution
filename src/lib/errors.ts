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
  throw e;
}