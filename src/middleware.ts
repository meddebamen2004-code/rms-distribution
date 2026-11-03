import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { HOME_BY_ROLE, ROLES, type Role } from "@/lib/roles";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const ROLE_BY_PREFIX: Record<string, Role> = {
  "/gerant": "GERANT",
  "/magasinier": "MAGASINIER",
  "/livreur": "LIVREUR",
};

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("session")?.value;
  let role: Role | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      const r = payload.role as Role;
      if (ROLES.includes(r)) role = r;
    } catch {
      role = null;
    }
  }

  // Pas connecté : retour à la connexion
  if (!role) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Connecté mais dans l'espace d'un autre rôle : renvoi vers le sien
  const { pathname } = req.nextUrl;
  const prefix = Object.keys(ROLE_BY_PREFIX).find(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  if (prefix && ROLE_BY_PREFIX[prefix] !== role) {
    return NextResponse.redirect(new URL(HOME_BY_ROLE[role], req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/gerant/:path*", "/magasinier/:path*", "/livreur/:path*"],
};