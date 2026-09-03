import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { scryptSync, timingSafeEqual } from "node:crypto";

const SESSION_SECRET: string = (() => {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set. Copy .env.example to .env and set a long random value.");
  }
  return value;
})();

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, SESSION_SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): string | null {
  try {
    const payload = jwt.verify(token, SESSION_SECRET) as { sub: string };
    return payload.sub;
  } catch {
    return null;
  }
}

// bcryptjs (pure JS, no native addon to compile — same reasoning as
// node:sqlite elsewhere in this app) at cost 10, per spec.
export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, stored: string): boolean {
  return bcrypt.compareSync(password, stored);
}

// This app briefly hashed passwords with scrypt ("saltHex:hashHex") before
// switching to bcrypt. Any account created or reset during that window has
// a hash in that shape, which bcrypt.compareSync will just (harmlessly)
// call not-a-match on — verifyLegacyScryptPassword lets the login route
// fall back to checking that shape too, so nobody who set a password before
// this change gets locked out of what may be the only Owner account.
export function isLegacyScryptHash(stored: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]+$/i.test(stored);
}

export function verifyLegacyScryptPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = Buffer.from(hashHex, "hex");
  const candidate = scryptSync(password, Buffer.from(saltHex, "hex"), hash.length);
  return candidate.length === hash.length && timingSafeEqual(candidate, hash);
}
