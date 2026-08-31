-- Replaces Microsoft/Entra ID SSO with manually-created accounts: a Team
-- Lead creates each user with a name/email/initial password instead of
-- everyone bootstrapping themselves in on first sign-in.
ALTER TABLE users ADD COLUMN password_hash TEXT;
