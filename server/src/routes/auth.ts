import { Router } from "express";
import { db } from "../db.js";
import { signSession, verifyPassword } from "../auth.js";
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

authRouter.post("/login", (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email?.trim() || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(String(email).trim().toLowerCase()) as
    | UserRow
    | undefined;
  if (!user || !user.password_hash || !verifyPassword(password, user.password_hash)) {
    res.status(401).json({ error: "Incorrect email or password." });
    return;
  }
  if (!user.is_active) {
    res.status(403).json({ error: "This account has been deactivated. Contact a Team Lead." });
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
