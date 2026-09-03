import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

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
