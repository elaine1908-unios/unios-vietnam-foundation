import { randomBytes, createHash } from "node:crypto";
import { createRemoteJWKSet, jwtVerify } from "jose";

// Plain fetch-based Authorization Code + PKCE flow against the Microsoft
// identity platform (v2.0 endpoints) — no SDK, so there's no library-version
// surface to track. See server/.env.example for the Azure app registration
// this needs (AZURE_TENANT_ID / AZURE_CLIENT_ID / AZURE_CLIENT_SECRET).

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set. See server/.env.example.`);
  return value;
}

export function azureConfigured(): boolean {
  return Boolean(process.env.AZURE_TENANT_ID && process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET);
}

function authority(): string {
  return `https://login.microsoftonline.com/${requiredEnv("AZURE_TENANT_ID")}/oauth2/v2.0`;
}

function redirectUri(): string {
  return `${requiredEnv("APP_BASE_URL")}/api/auth/callback`;
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function pkceChallenge(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildAuthorizeUrl(state: string, verifier: string): string {
  const params = new URLSearchParams({
    client_id: requiredEnv("AZURE_CLIENT_ID"),
    response_type: "code",
    redirect_uri: redirectUri(),
    response_mode: "query",
    scope: "openid profile email",
    state,
    code_challenge: pkceChallenge(verifier),
    code_challenge_method: "S256",
  });
  return `${authority()}/authorize?${params.toString()}`;
}

interface IdentityClaims {
  email: string;
  name: string;
}

export async function exchangeCodeForIdentity(code: string, verifier: string): Promise<IdentityClaims> {
  const body = new URLSearchParams({
    client_id: requiredEnv("AZURE_CLIENT_ID"),
    client_secret: requiredEnv("AZURE_CLIENT_SECRET"),
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier,
  });

  const tokenRes = await fetch(`${authority()}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!tokenRes.ok) {
    throw new Error(`Azure AD token exchange failed (${tokenRes.status}): ${await tokenRes.text()}`);
  }
  const { id_token } = (await tokenRes.json()) as { id_token: string };

  // Verify the id_token's signature against Microsoft's published keys
  // rather than trusting it just because it came back over HTTPS.
  const jwks = createRemoteJWKSet(new URL(`${authority()}/keys`));
  const { payload } = await jwtVerify(id_token, jwks, {
    issuer: undefined, // Entra ID's issuer is tenant-specific (contains a GUID); audience check below is sufficient here.
    audience: requiredEnv("AZURE_CLIENT_ID"),
  });

  const email = (payload.email ?? payload.preferred_username) as string | undefined;
  const name = (payload.name as string | undefined) ?? email;
  if (!email) throw new Error("Azure AD did not return an email claim for this account.");
  return { email: email.toLowerCase(), name: name ?? email };
}
