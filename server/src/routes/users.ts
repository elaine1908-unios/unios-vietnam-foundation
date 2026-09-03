import { Router } from "express";
import { db } from "../db.js";
import { hashPassword } from "../auth.js";
import { newId } from "../ids.js";
import { requireAuth, requireCap } from "../middleware.js";
import { logAudit, diffAndLog } from "../audit.js";
import { toPublicUser } from "../types.js";
import type { UserRow } from "../types.js";
import { ACCESS_LEVELS, isAccessLevel } from "../capabilities.js";
import type { AccessLevel } from "../capabilities.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireCap("user.admin"));

// Built from ACCESS_LEVELS (capabilities.ts), never hand-written — so this
// message can't go stale the moment a level is added or renamed there.
const INVALID_LEVEL_MESSAGE = `access_level must be one of: ${ACCESS_LEVELS.join(", ")}.`;

function countActiveOwners(excludingId?: string): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) as n FROM users WHERE access_level = 'owner' AND is_active = 1" +
        (excludingId ? " AND id != ?" : ""),
    )
    .get(...(excludingId ? [excludingId] : [])) as { n: number };
  return row.n;
}

usersRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY name COLLATE NOCASE").all() as unknown as UserRow[];
  res.json(rows.map(toPublicUser));
});

usersRouter.post("/", (req, res) => {
  const { name, email, password, access_level } = req.body as {
    name?: string;
    email?: string;
    password?: string;
    access_level?: string;
  };
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400).json({ error: "Name, email, and password are required." });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail);
  if (existing) {
    res.status(400).json({ error: "A user with that email already exists." });
    return;
  }
  // An unknown level falls back to the least privileged on create (as
  // opposed to PATCH below, which rejects one outright) — see spec section 7.
  const finalLevel: AccessLevel = isAccessLevel(access_level) ? access_level : "team_member";
  const id = newId();
  // must_change_password = 1: this account's password was chosen by
  // whoever is creating it, not by the person who'll use it.
  db.prepare(
    "INSERT INTO users (id, name, email, access_level, password_hash, must_change_password) VALUES (?, ?, ?, ?, ?, 1)",
  ).run(id, name.trim(), normalizedEmail, finalLevel, hashPassword(password));
  logAudit("user", id, "created", req.user!.id, "access_level", null, finalLevel);
  res.status(201).json(toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(id) as unknown as UserRow));
});

usersRouter.patch("/:id", (req, res) => {
  const { access_level } = req.body as { access_level?: string };
  if (!isAccessLevel(access_level)) {
    res.status(400).json({ error: INVALID_LEVEL_MESSAGE });
    return;
  }
  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as unknown as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  if (target.access_level === "owner" && access_level !== "owner" && countActiveOwners(target.id) === 0) {
    res.status(400).json({ error: "At least one active Owner must remain — promote someone else first." });
    return;
  }
  diffAndLog("user", target.id, { access_level: target.access_level }, { access_level }, ["access_level"], req.user!.id);
  db.prepare("UPDATE users SET access_level = ? WHERE id = ?").run(access_level, target.id);
  res.json(toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(target.id) as unknown as UserRow));
});

// Soft delete — deactivate, never a hard delete (profiles/career roles/audit
// entries reference created_by/updated_by/changed_by).
usersRouter.delete("/:id", (req, res) => {
  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as unknown as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  if (target.id === req.user!.id) {
    res.status(400).json({ error: "You can't deactivate your own account." });
    return;
  }
  if (target.access_level === "owner" && countActiveOwners(target.id) === 0) {
    res.status(400).json({ error: "At least one active Owner must remain — promote someone else first." });
    return;
  }
  db.prepare("UPDATE users SET is_active = 0 WHERE id = ?").run(target.id);
  logAudit("user", target.id, "deactivated", req.user!.id, "is_active", "true", "false");
  res.json(toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(target.id) as unknown as UserRow));
});

usersRouter.post("/:id/reactivate", (req, res) => {
  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as unknown as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  db.prepare("UPDATE users SET is_active = 1 WHERE id = ?").run(target.id);
  logAudit("user", target.id, "reactivated", req.user!.id, "is_active", "false", "true");
  res.json(toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(target.id) as unknown as UserRow));
});

// For someone who forgot their password — no current-password check (that's
// the point), but always forces a change on next sign-in.
usersRouter.post("/:id/reset-password", (req, res) => {
  const { password } = req.body as { password?: string };
  if (!password || password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters." });
    return;
  }
  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as unknown as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  db.prepare("UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?").run(
    hashPassword(password),
    target.id,
  );
  logAudit("user", target.id, "password_reset", req.user!.id, "password", "<hidden>", "<reset>");
  res.json({ ok: true });
});
