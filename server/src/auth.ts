import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { scryptSync, timingSafeEqual, randomBytes, createCipheriv, createDecipheriv } from "node:crypto";

const SESSION_SECRET: string = (() => {
  const value = process.env.SESSION_SECRET;
  if (!value) {
    throw new Error("SESSION_SECRET is not set. Copy .env.example to .env and set a long random value.");
  }
  return value;
})();

const TOTP_ENCRYPTION_KEY: Buffer = (() => {
  const value = process.env.TOTP_ENCRYPTION_KEY;
  if (!value) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY is not set. Copy .env.example to .env and set a 32-byte hex value (openssl rand -hex 32).",
    );
  }
  const key = Buffer.from(value, "hex");
  if (key.length !== 32) {
    throw new Error("TOTP_ENCRYPTION_KEY must be a 32-byte value, hex-encoded (64 hex characters).");
  }
  return key;
})();

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, SESSION_SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): string | null {
  try {
    const payload = jwt.verify(token, SESSION_SECRET) as { sub: string; purpose?: string };
    // Never treat a special-purpose token (e.g. the short-lived 2FA token
    // below) as a real session, even though both are signed with the same
    // secret — purpose-less is the only shape a real session token has.
    if (payload.purpose) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

const TWO_FACTOR_TOKEN_PURPOSE = "2fa";

// Issued by POST /login when the account has 2FA enabled — proves "this
// caller just supplied the correct password" without yet being a real
// session. Consumed once by POST /login/2fa. Short-lived, and the
// `purpose` claim keeps verifySession from ever accepting it as a session.
export function signTwoFactorToken(userId: string): string {
  return jwt.sign({ sub: userId, purpose: TWO_FACTOR_TOKEN_PURPOSE }, SESSION_SECRET, { expiresIn: "5m" });
}

export function verifyTwoFactorToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, SESSION_SECRET) as { sub: string; purpose?: string };
    return payload.purpose === TWO_FACTOR_TOKEN_PURPOSE ? payload.sub : null;
  } catch {
    return null;
  }
}

// AES-256-GCM: a TOTP secret must be recoverable to verify a live code
// (unlike a password, which only ever needs one-way comparison), so it's
// encrypted at rest rather than hashed. Stored as "iv:authTag:ciphertext",
// each base64.
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", TOTP_ENCRYPTION_KEY, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString("base64"), authTag.toString("base64"), ciphertext.toString("base64")].join(":");
}

export function decryptSecret(stored: string): string {
  const [ivB64, authTagB64, ciphertextB64] = stored.split(":");
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const ciphertext = Buffer.from(ciphertextB64, "base64");
  const decipher = createDecipheriv("aes-256-gcm", TOTP_ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString("utf8");
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
