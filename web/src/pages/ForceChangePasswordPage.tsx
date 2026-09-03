import { FormEvent, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";

// Shown instead of the requested page whenever the signed-in user's
// must_change_password flag is set — an admin (or first-run setup) chose
// this account's current password, so it must be replaced before anything
// else is reachable. See RequireAuth.tsx for where this is hooked in, and
// server/src/forcePasswordChangeGate.ts for the matching API-level gate.
export function ForceChangePasswordPage() {
  const { refresh } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setError("New password and confirmation don't match.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/me/password", { currentPassword, newPassword });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="card w-full max-w-sm">
        <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
        <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint mb-4">
          Unios Career and Foundations
        </p>
        <p className="font-display font-bold text-lg mb-1">Set a new password</p>
        <p className="text-sm text-ink-muted mb-6">
          Your password was set by someone else — choose your own before continuing.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input
            className="input"
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="New password (min. 8 characters)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Confirm new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-2" type="submit" disabled={submitting}>
            {submitting ? "Saving…" : "Set password"}
          </button>
        </form>
      </div>
    </div>
  );
}
