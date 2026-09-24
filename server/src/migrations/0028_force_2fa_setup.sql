-- Mandatory 2FA rollout: everyone without it enrolls on their next login,
-- and it's re-required for any account created or password-reset from here
-- on (see must_setup_2fa usage in routes/users.ts and force2faSetupGate.ts).
ALTER TABLE users ADD COLUMN must_setup_2fa INTEGER NOT NULL DEFAULT 0;

-- One-time company-wide rollout: force every existing user who doesn't
-- already have 2FA enabled to set it up on their next login.
UPDATE users SET must_setup_2fa = 1 WHERE totp_enabled = 0;
