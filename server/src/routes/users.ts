import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireTeamLead } from "../middleware.js";
import { logAudit } from "../audit.js";
import { toPublicUser } from "../types.js";
import type { UserRow, UserRole } from "../types.js";

export const usersRouter = Router();

usersRouter.use(requireAuth, requireTeamLead);

usersRouter.get("/", (_req, res) => {
  const rows = db.prepare("SELECT * FROM users ORDER BY name COLLATE NOCASE").all() as unknown as UserRow[];
  res.json(rows.map(toPublicUser));
});

usersRouter.patch("/:id/role", (req, res) => {
  const { role } = req.body as { role?: UserRole };
  if (role !== "team_lead" && role !== "team_member") {
    res.status(400).json({ error: "role must be 'team_lead' or 'team_member'." });
    return;
  }
  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as unknown as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  if (target.id === req.user!.id && role === "team_member") {
    const otherLeads = (
      db.prepare("SELECT COUNT(*) as n FROM users WHERE role = 'team_lead' AND id != ? AND is_active = 1").get(target.id) as {
        n: number;
      }
    ).n;
    if (otherLeads === 0) {
      res.status(400).json({ error: "You're the only Team Lead — promote someone else first." });
      return;
    }
  }
  db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, target.id);
  logAudit("user", target.id, "role_changed", req.user!.id);
  res.json(toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(target.id) as unknown as UserRow));
});

usersRouter.patch("/:id/active", (req, res) => {
  const { is_active } = req.body as { is_active?: boolean };
  const target = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as unknown as UserRow | undefined;
  if (!target) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  if (target.id === req.user!.id && !is_active) {
    res.status(400).json({ error: "You can't deactivate your own account." });
    return;
  }
  db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, target.id);
  logAudit("user", target.id, is_active ? "reactivated" : "deactivated", req.user!.id);
  res.json(toPublicUser(db.prepare("SELECT * FROM users WHERE id = ?").get(target.id) as unknown as UserRow));
});
