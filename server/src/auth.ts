import jwt from "jsonwebtoken";

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

// Short-lived, separate secret usage from the session token: signs the OAuth
// state/PKCE verifier we hand to Microsoft and expect back on /callback, so a
// forged callback request can't be replayed without also forging this.
export function signOAuthState(payload: { state: string; verifier: string }): string {
  return jwt.sign(payload, SESSION_SECRET, { expiresIn: "10m" });
}

export function verifyOAuthState(token: string): { state: string; verifier: string } | null {
  try {
    return jwt.verify(token, SESSION_SECRET) as { state: string; verifier: string };
  } catch {
    return null;
  }
}
