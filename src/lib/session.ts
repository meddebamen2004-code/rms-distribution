import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ROLES, type Role } from "./roles";

const rawSecret = process.env.JWT_SECRET;
if (!rawSecret) {
  throw new Error("JWT_SECRET manquant dans le fichier .env");
}
const secret = new TextEncoder().encode(rawSecret);

export const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export type Session = { userId: number; role: Role };

export async function createSession(userId: number, role: Role) {
  const token = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as Role;
    if (!ROLES.includes(role)) return null;
    return { userId: payload.userId as number, role };
  } catch {
    return null; // token invalide ou expiré
  }
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}