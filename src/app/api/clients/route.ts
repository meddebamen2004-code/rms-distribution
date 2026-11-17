import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiRole } from "@/lib/api-auth";
import { clientSchema } from "@/lib/validation";
import { clientsDuJour } from "@/lib/secteur";

export async function GET() {
  const auth = await requireApiRole("GERANT", "MAGASINIER", "LIVREUR");
  if ("error" in auth) return auth.error;

  if (auth.user.role === "LIVREUR") {
    const { clients } = await clientsDuJour(auth.user.id);
    return NextResponse.json(clients);
  }

  const clients = await prisma.client.findMany({
    include: { secteur: true },
    orderBy: { nomCommerce: "asc" },
  });
  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const auth = await requireApiRole("GERANT");
  if ("error" in auth) return auth.error;

  const body = await req.json().catch(() => null);
  const confirmerDoublon = body?.confirmerDoublon === true;
  const parsed = clientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const secteur = await prisma.secteur.findUnique({ where: { id: parsed.data.secteurId } });
  if (!secteur) {
    return NextResponse.json({ error: "Secteur introuvable" }, { status: 400 });
  }

  // Doublon de téléphone : simple avertissement, le gérant peut confirmer
  if (!confirmerDoublon) {
    const doublon = await prisma.client.findFirst({
      where: { telephone: parsed.data.telephone },
    });
    if (doublon) {
      return NextResponse.json(
        {
          error: `Ce numéro est déjà associé à « ${doublon.nomCommerce} ».`,
          doublon: true,
        },
        { status: 409 }
      );
    }
  }

  const client = await prisma.client.create({ data: parsed.data });
  return NextResponse.json(client, { status: 201 });
}