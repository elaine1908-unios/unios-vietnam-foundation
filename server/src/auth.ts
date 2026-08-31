import jwt from "jsonwebtoken";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

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

// scrypt with a random salt, stored as "salt:hash" (both hex) in one column —
// no bcrypt dependency needed, node:crypto already ships this.
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = Buffer.from(hashHex, "hex");
  const candidate = scryptSync(password, Buffer.from(saltHex, "hex"), hash.length);
  return timingSafeEqual(candidate, hash);
}
