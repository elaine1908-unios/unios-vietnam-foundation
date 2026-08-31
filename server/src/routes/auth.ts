import { Router } from "express";
import { db } from "../db.js";
import { signSession, signOAuthState, verifyOAuthState } from "../auth.js";
import { azureConfigured, buildAuthorizeUrl, exchangeCodeForIdentity, randomToken } from "../azureAuth.js";
import { newId } from "../ids.js";
import { requireAuth } from "../middleware.js";
import { toPublicUser } from "../types.js";
import type { UserRow } from "../types.js";

export const authRouter = Router();

const SESSION_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

const STATE_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 10 * 60 * 1000,
};

// Whoever signs in first owns the account, same idea as a first-run setup
// screen — except here "signing up" just means completing SSO once, so
// there's no separate bootstrap step to build.
function upsertUserFromIdentity(email: string, name: string): UserRow {
  const existing = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as unknown as UserRow | undefined;
  if (existing) return existing;

  const userCount = (db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
  const role = userCount === 0 ? "team_lead" : "team_member";
  const id = newId();
  db.prepare("INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)").run(id, name, email, role);
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as UserRow;
}

authRouter.get("/config", (_req, res) => {
  res.json({ azureConfigured: azureConfigured(), devLoginEnabled: process.env.DEV_LOGIN === "true" });
});

authRouter.get("/login", (_req, res) => {
  if (!azureConfigured()) {
    res.status(500).json({ error: "Microsoft sign-in is not configured yet. See server/.env.example." });
    return;
  }
  const state = randomToken(16);
  const verifier = randomToken(32);
  res.cookie("oauth_state", signOAuthState({ state, verifier }), STATE_COOKIE);
  res.redirect(buildAuthorizeUrl(state, verifier));
});

authRouter.get("/callback", async (req, res) => {
  const { code, state, error, error_description } = req.query as Record<string, string | undefined>;
  if (error) {
    res.status(400).send(`Sign-in failed: ${error_description ?? error}`);
    return;
  }
  const stored = req.cookies?.oauth_state ? verifyOAuthState(req.cookies.oauth_state) : null;
  res.clearCookie("oauth_state");
  if (!stored || !code || !state || stored.state !== state) {
    res.status(400).send("Sign-in failed: the request expired or was tampered with. Please try again.");
    return;
  }

  try {
    const identity = await exchangeCodeForIdentity(code, stored.verifier);
    const user = upsertUserFromIdentity(identity.email, identity.name);
    if (!user.is_active) {
      res.status(403).send("This account has been deactivated. Contact a Team Lead.");
      return;
    }
    res.cookie("session", signSession(user.id), SESSION_COOKIE);
    res.redirect("/");
  } catch (err) {
    console.error("Azure AD sign-in failed:", err);
    res.status(500).send("Sign-in failed. Please try again or contact a Team Lead.");
  }
});

// Local development only, when a real Azure AD app registration isn't
// available yet — signs in as any {name, email} with no password check.
// Gated by DEV_LOGIN=true, which must never be set in production.
authRouter.post("/dev-login", (req, res) => {
  if (process.env.DEV_LOGIN !== "true") {
    res.status(404).json({ error: "Not found." });
    return;
  }
  const { name, email } = req.body ?? {};
  if (!name?.trim() || !email?.trim()) {
    res.status(400).json({ error: "Name and email are required." });
    return;
  }
  const user = upsertUserFromIdentity(String(email).trim().toLowerCase(), String(name).trim());
  if (!user.is_active) {
    res.status(403).json({ error: "This account has been deactivated." });
    return;
  }
  res.cookie("session", signSession(user.id), SESSION_COOKIE);
  res.json(toPublicUser(user));
});

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("session");
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});
