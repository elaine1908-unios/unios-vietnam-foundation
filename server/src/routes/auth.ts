import { Router } from "express";
import { db } from "../db.js";
import { signSession, verifyPassword, hashPassword, isLegacyScryptHash, verifyLegacyScryptPassword } from "../auth.js";
import { newId } from "../ids.js";
import { requireAuth } from "../middleware.js";
import { logAudit } from "../audit.js";
import { toPublicUser } from "../types.js";
import type { UserRow } from "../types.js";

export const authRouter = Router();

const SESSION_COOKIE = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

function userCount(): number {
  return (db.prepare("SELECT COUNT(*) as n FROM users").get() as { n: number }).n;
}

// Public — tells the client whether to show the one-time setup screen or the
// normal login form. Reveals nothing except a boolean.
authRouter.get("/setup-status", (_req, res) => {
  res.json({ needsSetup: userCount() === 0 });
});

// First run only. Creates the first account at access level 'owner' and
// signs them in. Refuses once ANY user exists — 'owner' is an access level,
// not a hardcoded person, so this takes whatever name/email/password is
// posted rather than special-casing an address.
authRouter.post("/setup", (req, res) => {
  if (userCount() > 0) {
    res.status(403).json({ error: "Setup has already been completed." });
    return;
  }
  const { name, email, password } = req.body ?? {};
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }
  if (String(password).length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  const id = newId();
  // must_change_password stays false: this person chose their own password,
  // there's no "someone else's temporary password" to force a change from.
  db.prepare("INSERT INTO users (id, name, email, access_level, password_hash) VALUES (?, ?, ?, 'owner', ?)").run(
    id,
    String(name).trim(),
    String(email).trim().toLowerCase(),
    hashPassword(String(password)),
  );
  logAudit("user", id, "created", id, "access_level", null, "owner");
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as UserRow;
  res.cookie("session", signSession(user.id), SESSION_COOKIE);
  res.status(201).json(toPublicUser(user));
});

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).trim().toLowerCase()) as
    | UserRow
    | undefined;
  if (!user || !user.password_hash) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }
  let ok = verifyPassword(password, user.password_hash);
  if (!ok && isLegacyScryptHash(user.password_hash) && verifyLegacyScryptPassword(password, user.password_hash)) {
    // Correct password, just hashed with the algorithm this app used
    // before switching to bcrypt — silently re-hash so this only ever
    // happens once per account.
    const rehashed = hashPassword(password);
    db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(rehashed, user.id);
    user.password_hash = rehashed;
    ok = true;
  }
  if (!ok) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ error: "This account has been deactivated. Contact an Owner." });
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

// Self-service display-name change. email and access_level are deliberately
// IGNORED even if present in the body — this endpoint must never be usable
// for privilege escalation or for making an account unfindable by email.
authRouter.patch("/me", requireAuth, (req, res) => {
  const { name } = req.body ?? {};
  if (!name?.trim()) {
    res.status(400).json({ error: "Name is required." });
    return;
  }
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(String(name).trim(), req.user!.id);
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as unknown as UserRow;
  res.json(toPublicUser(user));
});

// Self-service password change — requires the CURRENT password (so a
// borrowed unlocked screen can't be used to take the account over), and this
// is also how a forced first-time change is completed: the "current"
// password is simply whatever the admin set for them.
authRouter.post("/me/password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password are required." });
    return;
  }
  if (String(newPassword).length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as unknown as UserRow;
  if (!user.password_hash || !verifyPassword(currentPassword, user.password_hash)) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }
  if (verifyPassword(newPassword, user.password_hash)) {
    res.status(400).json({ error: "New password must be different from your current password." });
    return;
  }
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?").run(
    hashPassword(newPassword),
    user.id,
  );
  logAudit("user", user.id, "updated", user.id, "password", "<hidden>", "<changed>");
  const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as unknown as UserRow;
  res.json(toPublicUser(updated));
});
