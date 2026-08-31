import type { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { verifySession } from "./auth.js";
import { toPublicUser } from "./types.js";
import type { UserRow } from "./types.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  const userId = token ? verifySession(token) : null;
  if (!userId) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as unknown as UserRow | undefined;
  if (!row) {
    res.status(401).json({ error: "Account no longer exists." });
    return;
  }
  if (!row.is_active) {
    res.status(401).json({ error: "This account has been deactivated. Contact a Team Lead." });
    return;
  }
  req.user = toPublicUser(row);
  next();
}

// Team leads can create/edit/archive profiles and manage users. Team members
// are read-only everywhere (view, search, download the watermarked PDF).
export function requireTeamLead(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "team_lead") {
    res.status(403).json({ error: "Team Lead access required." });
    return;
  }
  next();
}
