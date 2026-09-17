import { FormEvent, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import { ACCESS_LEVEL_LABELS } from "../lib/types";

interface TwoFactorSetup {
  secret: string;
  otpauth_uri: string;
  qr_code_data_url: string;
}

export function AccountPage() {
  const { user, refresh } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  // null = no setup in progress (shows either "Enable" or, if already
  // enabled, the disable form). Set once "Enable" starts /2fa/setup.
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [confirmCode, setConfirmCode] = useState("");
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);

  if (!user) return null;

  async function savePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirm) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    setPasswordSaving(true);
    setPasswordError(null);
    setPasswordSaved(false);
    try {
      await api.post("/auth/me/password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setPasswordSaving(false);
    }
  }

  async function startTwoFactorSetup() {
    setTwoFactorError(null);
    setTwoFactorBusy(true);
    try {
      const result = await api.post<TwoFactorSetup>("/2fa/setup");
      setSetup(result);
    } catch (err) {
      setTwoFactorError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function confirmTwoFactorSetup(e: FormEvent) {
    e.preventDefault();
    setTwoFactorError(null);
    setTwoFactorBusy(true);
    try {
      await api.post("/2fa/confirm", { code: confirmCode });
      setSetup(null);
      setConfirmCode("");
      await refresh();
    } catch (err) {
      setTwoFactorError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function disableTwoFactor(e: FormEvent) {
    e.preventDefault();
    setTwoFactorError(null);
    setTwoFactorBusy(true);
    try {
      await api.post("/2fa/disable", { password: disablePassword });
      setDisablePassword("");
      setShowDisableForm(false);
      await refresh();
    } catch (err) {
      setTwoFactorError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setTwoFactorBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display font-bold text-xl mb-1">My account</h1>
      <p className="text-sm text-ink-muted mb-4">
        {user.email} · {ACCESS_LEVEL_LABELS[user.access_level]}
      </p>

      <div className="card mb-6 flex flex-col gap-1">
        <h2 className="font-display font-semibold mb-1">Name</h2>
        <p className="text-sm">{user.name}</p>
        <p className="text-xs text-ink-faint">
          Taken from your Employee Master record — update it there if it's wrong.
        </p>
      </div>

      <form onSubmit={savePassword} className="card flex flex-col gap-2">
        <h2 className="font-display font-semibold mb-1">Change password</h2>
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
        {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
        {passwordSaved && <p className="text-sm text-green-700">Password updated.</p>}
        <button className="btn-primary self-start" type="submit" disabled={passwordSaving}>
          {passwordSaving ? "Saving…" : "Change password"}
        </button>
      </form>

      <div className="card mt-6 flex flex-col gap-2">
        <h2 className="font-display font-semibold mb-1">Two-factor authentication</h2>

        {setup ? (
          <form onSubmit={confirmTwoFactorSetup} className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted">
              Scan this QR code with your Microsoft Authenticator App, then enter the 6-digit code it shows.
            </p>
            <img src={setup.qr_code_data_url} alt="2FA setup QR code" className="w-40 h-40 self-center" />
            <p className="text-xs text-ink-faint">
              Can't scan it? Enter this code manually: <span className="font-mono">{setup.secret}</span>
            </p>
            <input
              className="input"
              inputMode="numeric"
              placeholder="6-digit code"
              value={confirmCode}
              onChange={(e) => setConfirmCode(e.target.value)}
              required
            />
            {twoFactorError && <p className="text-sm text-red-600">{twoFactorError}</p>}
            <div className="flex gap-2">
              <button className="btn-primary self-start" type="submit" disabled={twoFactorBusy}>
                {twoFactorBusy ? "Confirming…" : "Confirm and enable"}
              </button>
              <button
                className="text-sm text-ink-muted hover:text-ink"
                type="button"
                onClick={() => {
                  setSetup(null);
                  setConfirmCode("");
                  setTwoFactorError(null);
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : user.has_2fa ? (
          <>
            <p className="text-sm text-ink-muted">Two-factor authentication is enabled on your account.</p>
            {showDisableForm ? (
              <form onSubmit={disableTwoFactor} className="flex flex-col gap-2">
                <input
                  className="input"
                  type="password"
                  placeholder="Current password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  required
                />
                {twoFactorError && <p className="text-sm text-red-600">{twoFactorError}</p>}
                <div className="flex gap-2">
                  <button className="btn-primary self-start" type="submit" disabled={twoFactorBusy}>
                    {twoFactorBusy ? "Disabling…" : "Disable 2FA"}
                  </button>
                  <button
                    className="text-sm text-ink-muted hover:text-ink"
                    type="button"
                    onClick={() => {
                      setShowDisableForm(false);
                      setDisablePassword("");
                      setTwoFactorError(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button className="btn-primary self-start" type="button" onClick={() => setShowDisableForm(true)}>
                Disable 2FA
              </button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-ink-muted">
              Add an extra layer of security to your account using an authenticator app.
            </p>
            {twoFactorError && <p className="text-sm text-red-600">{twoFactorError}</p>}
            <button className="btn-primary self-start" type="button" onClick={startTwoFactorSetup} disabled={twoFactorBusy}>
              {twoFactorBusy ? "Starting…" : "Enable 2FA"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
