-- Optional TOTP-based 2FA, opt-in per account. totp_secret is encrypted at
-- rest (AES-256-GCM, see encryptSecret/decryptSecret in auth.ts) rather than
-- hashed — unlike a password, verifying a TOTP code requires recovering the
-- original secret, not just comparing a one-way digest.
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN totp_enabled_at TEXT;
