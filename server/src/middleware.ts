import type { Request, Response, NextFunction } from "express";
import { db } from "./db.js";
import { verifySession } from "./auth.js";
import { toPublicUser } from "./types.js";
import type { UserRow } from "./types.js";
import { hasCapability } from "./capabilities.js";
import type { Capability } from "./capabilities.js";

// Global — mounted once, before every router. Populates req.user when the
// session cookie is valid, but never rejects: /api/public/* must stay fully
// reachable with no user at all. Every protected route still layers
// requireAuth or requireCap on top of this.
export function attachUser(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.session;
  const userId = token ? verifySession(token) : null;
  if (!userId) {
    next();
    return;
  }
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId) as unknown as UserRow | undefined;
  if (row && row.is_active) {
    req.user = toPublicUser(row);
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Not signed in." });
    return;
  }
  next();
}

// requireCap(cap) implies requireAuth — no signed-in user can never hold a
// capability. Apply this to every route, read and write alike, rather than
// assuming a plain requireAuth is enough: that's how a route ends up
// reachable by any signed-in user regardless of access level.
export function requireCap(cap: Capability) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Not signed in." });
      return;
    }
    if (!hasCapability(req.user.access_level, cap)) {
      res.status(403).json({ error: "You don't have permission to do that." });
      return;
    }
    next();
  };
}
