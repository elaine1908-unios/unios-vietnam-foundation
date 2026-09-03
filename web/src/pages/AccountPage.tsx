import { FormEvent, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import { ACCESS_LEVEL_LABELS } from "../lib/types";

export function AccountPage() {
  const { user, refresh } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [nameError, setNameError] = useState<string | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  if (!user) return null;

  async function saveName(e: FormEvent) {
    e.preventDefault();
    setNameSaving(true);
    setNameError(null);
    setNameSaved(false);
    try {
      await api.patch("/auth/me", { name });
      await refresh();
      setNameSaved(true);
    } catch (err) {
      setNameError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setNameSaving(false);
    }
  }

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

  return (
    <div className="max-w-md">
      <h1 className="font-display font-bold text-xl mb-1">My account</h1>
      <p className="text-sm text-ink-muted mb-4">
        {user.email} · {ACCESS_LEVEL_LABELS[user.access_level]}
      </p>

      <form onSubmit={saveName} className="card mb-6 flex flex-col gap-2">
        <h2 className="font-display font-semibold mb-1">Name</h2>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        {nameError && <p className="text-sm text-red-600">{nameError}</p>}
        {nameSaved && <p className="text-sm text-green-700">Saved.</p>}
        <button className="btn-primary self-start" type="submit" disabled={nameSaving}>
          {nameSaving ? "Saving…" : "Save name"}
        </button>
      </form>

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
    </div>
  );
}
