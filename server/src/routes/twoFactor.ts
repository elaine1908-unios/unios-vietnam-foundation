import { Router } from "express";
import { generateSecret, generateURI, verify } from "otplib";
import QRCode from "qrcode";
import { db } from "../db.js";
import { requireAuth } from "../middleware.js";
import { verifyPassword, encryptSecret, decryptSecret } from "../auth.js";
import { logAudit } from "../audit.js";
import type { UserRow } from "../types.js";

export const twoFactorRouter = Router();

// Self-service only — matches /auth/me/password's trust model (you must
// already be signed in as yourself to touch this).
twoFactorRouter.use(requireAuth);

const ISSUER = "Unios Foundation";
// ±1 time-step (30s each way) tolerance for clock drift between the
// server and the user's phone — same margin most authenticator-app
// integrations use.
const EPOCH_TOLERANCE_SECONDS = 30;

// Always overwrites with a fresh secret and leaves totp_enabled untouched
// — an abandoned setup just leaves an unused secret that the next setup
// attempt overwrites; nothing is "enabled" until POST /confirm succeeds.
twoFactorRouter.post("/setup", async (req, res) => {
  const secret = generateSecret();
  db.prepare("UPDATE users SET totp_secret = ? WHERE id = ?").run(encryptSecret(secret), req.user!.id);
  const otpauthUri = generateURI({ issuer: ISSUER, label: req.user!.email, secret });
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUri);
  res.json({ secret, otpauth_uri: otpauthUri, qr_code_data_url: qrCodeDataUrl });
});

twoFactorRouter.post("/confirm", async (req, res) => {
  const { code } = req.body as { code?: string };
  if (!code?.trim()) {
    res.status(400).json({ error: "Enter the 6-digit code from your authenticator app." });
    return;
  }
  const row = db.prepare("SELECT totp_secret FROM users WHERE id = ?").get(req.user!.id) as
    | { totp_secret: string | null }
    | undefined;
  if (!row?.totp_secret) {
    res.status(400).json({ error: "Start setup first." });
    return;
  }
  const secret = decryptSecret(row.totp_secret);
  const result = await verify({ secret, token: code.trim(), epochTolerance: EPOCH_TOLERANCE_SECONDS });
  if (!result.valid) {
    res.status(400).json({ error: "That code doesn't match. Check the time on your device and try again." });
    return;
  }
  db.prepare(
    "UPDATE users SET totp_enabled = 1, totp_enabled_at = datetime('now'), must_setup_2fa = 0 WHERE id = ?",
  ).run(req.user!.id);
  logAudit("user", req.user!.id, "updated", req.user!.id, "totp_enabled", "false", "true");
  res.json({ ok: true });
});

// Requires the current password — a hijacked-but-unlocked browser session
// alone can't silently turn 2FA off.
twoFactorRouter.post("/disable", (req, res) => {
  const { password } = req.body as { password?: string };
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user!.id) as unknown as UserRow;
  if (!password || !row.password_hash || !verifyPassword(password, row.password_hash)) {
    res.status(401).json({ error: "Current password is incorrect." });
    return;
  }
  db.prepare("UPDATE users SET totp_secret = NULL, totp_enabled = 0, totp_enabled_at = NULL WHERE id = ?").run(
    req.user!.id,
  );
  logAudit("user", req.user!.id, "updated", req.user!.id, "totp_enabled", "true", "false");
  res.json({ ok: true });
});
