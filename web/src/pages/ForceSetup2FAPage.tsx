import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";

interface TwoFactorSetup {
  secret: string;
  otpauth_uri: string;
  qr_code_data_url: string;
}

// Shown instead of the requested page whenever the signed-in user's
// must_setup_2fa flag is set and they don't have 2FA enabled yet — a new
// account, an admin-reset password, or the one-time company-wide rollout
// (see migrations/0028_force_2fa_setup.sql) all require it before anything
// else is reachable. See RequireAuth.tsx for where this is hooked in
// (right after the forced-password-change check), and
// server/src/force2faSetupGate.ts for the matching API-level gate. Unlike
// AccountPage.tsx's version of this same setup flow, there's no "Enable"
// button to start it — it's not optional here, so setup begins as soon as
// this page mounts, and there's no way to back out of it.
export function ForceSetup2FAPage() {
  const { refresh } = useAuth();
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .post<TwoFactorSetup>("/2fa/setup")
      .then(setSetup)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Something went wrong."));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post("/2fa/confirm", { code });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="card w-full max-w-sm">
        <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
        <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint mb-4">
          Careers and Foundation
        </p>
        <p className="font-display font-bold text-lg mb-1">Set up two-factor authentication</p>
        <p className="text-sm text-ink-muted mb-4">
          Required for every account before continuing — scan this QR code with your Microsoft Authenticator App,
          then enter the 6-digit code it shows.
        </p>

        {setup ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <img src={setup.qr_code_data_url} alt="2FA setup QR code" className="w-40 h-40 self-center" />
            <p className="text-xs text-ink-faint">
              Can't scan it? Enter this code manually: <span className="font-mono">{setup.secret}</span>
            </p>
            <input
              className="input"
              inputMode="numeric"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary mt-2" type="submit" disabled={busy}>
              {busy ? "Confirming…" : "Confirm and continue"}
            </button>
          </form>
        ) : (
          error && <p className="text-sm text-red-600">{error}</p>
        )}
      </div>
    </div>
  );
}
