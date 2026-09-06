import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { User, AccessLevel, EmployeeDetail } from "../lib/types";
import { ACCESS_LEVELS, ACCESS_LEVEL_LABELS } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";
import { employeeDisplayName } from "../lib/vietnamese";

export function UserManagementPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("team_lead");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  // Looked up as soon as the email field loses focus — every account has
  // to correspond to a real, active employee (matched by Work Email), and
  // the name is taken from there rather than typed here, so this preview
  // is also the create form's only way to confirm "yes, this is the right
  // person" before submitting.
  const [matchedEmployee, setMatchedEmployee] = useState<EmployeeDetail | null | undefined>(undefined);
  const [checkingEmail, setCheckingEmail] = useState(false);

  async function handleEmailBlur() {
    const trimmed = email.trim();
    if (!trimmed) {
      setMatchedEmployee(undefined);
      return;
    }
    setCheckingEmail(true);
    try {
      const found = await api.get<EmployeeDetail | null>(`/employees/by-work-email?email=${encodeURIComponent(trimmed)}`);
      setMatchedEmployee(found);
    } catch {
      setMatchedEmployee(null);
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/users", { email, password, access_level: accessLevel });
      setEmail("");
      setPassword("");
      setAccessLevel("team_lead");
      setMatchedEmployee(undefined);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  async function setLevelFor(id: string, access_level: AccessLevel) {
    try {
      await api.patch(`/users/${id}`, { access_level });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function deactivate(id: string) {
    try {
      await api.delete(`/users/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function reactivate(id: string) {
    try {
      await api.post(`/users/${id}/reactivate`);
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function resetPassword(id: string, name: string) {
    const newPassword = prompt(`New password for ${name} (min. 8 characters):`);
    if (!newPassword) return;
    try {
      await api.post(`/users/${id}/reset-password`, { password: newPassword });
      alert("Password reset. They'll be asked to set their own on next sign-in.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  const [syncing, setSyncing] = useState(false);

  // Retroactive fix for accounts created before names were derived from
  // Employee Master, or whose linked employee's name has since changed —
  // see routes/users.ts's sync-names-from-employees for the exact match
  // rules (Work Email, case-insensitive, regardless of archived status).
  async function syncNames() {
    setSyncing(true);
    try {
      const result = await api.post<{ updated: number; unmatched: number; total: number }>(
        "/users/sync-names-from-employees",
      );
      alert(
        `Updated ${result.updated} name${result.updated === 1 ? "" : "s"}. ` +
          `${result.unmatched} account${result.unmatched === 1 ? "" : "s"} have no matching employee and were left alone.`,
      );
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-bold text-xl mb-1">User management</h1>
      <p className="text-sm text-ink-muted mb-4">
        Accounts are created manually here, not via self-service sign-up. Whoever creates an account (or has their
        password reset) is asked to set their own password on next sign-in.
      </p>

      <form onSubmit={handleCreate} className="card mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2 flex flex-col gap-1">
          <input
            className="input"
            type="email"
            placeholder="Work Email (must match an active Employee Master record)"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setMatchedEmployee(undefined);
            }}
            onBlur={handleEmailBlur}
            required
          />
          {checkingEmail && <p className="text-xs text-ink-faint">Checking…</p>}
          {!checkingEmail && matchedEmployee === null && (
            <p className="text-xs text-red-600">
              No active employee found with this Work Email — add them to Employee Master first.
            </p>
          )}
          {!checkingEmail && matchedEmployee && (
            <p className="text-xs text-accent">Matched: {employeeDisplayName(matchedEmployee)}</p>
          )}
        </div>
        <input
          className="input"
          type="password"
          placeholder="Initial password (min. 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <select className="input" value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as AccessLevel)}>
          {ACCESS_LEVELS.map((l) => (
            <option key={l} value={l}>
              {ACCESS_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
        {createError && <p className="text-sm text-red-600 sm:col-span-2">{createError}</p>}
        <button
          className="btn-primary sm:col-span-2"
          type="submit"
          disabled={creating || checkingEmail || !matchedEmployee}
        >
          {creating ? "Creating…" : "Create user"}
        </button>
      </form>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-ink-faint">
          Updates every existing account's name to match its linked Employee Master record (by Work Email) —
          useful right after linking accounts to employees for the first time.
        </p>
        <button className="btn-secondary shrink-0" onClick={syncNames} disabled={syncing} type="button">
          {syncing ? "Syncing…" : "Sync names from Employee Master"}
        </button>
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {(error || !data) && !isLoading && <p className="text-sm text-red-600">Couldn't load users.</p>}
      {data && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Email</th>
                  <th className="px-3 py-2 font-medium">Access level</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {data.map((u) => (
                  <tr key={u.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{u.name}</td>
                    <td className="px-3 py-2 text-ink-muted">{u.email}</td>
                    <td className="px-3 py-2">
                      <select
                        className="input !w-auto py-1"
                        value={u.access_level}
                        onChange={(e) => setLevelFor(u.id, e.target.value as AccessLevel)}
                      >
                        {ACCESS_LEVELS.map((l) => (
                          <option key={l} value={l}>
                            {ACCESS_LEVEL_LABELS[l]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {u.is_active ? "Active" : "Deactivated"}
                      {u.must_change_password && u.is_active && (
                        <span className="ml-1 text-xs text-ink-faint">(must change password)</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button className="text-sm text-accent mr-3" onClick={() => resetPassword(u.id, u.name)}>
                        Reset password
                      </button>
                      {u.id !== me?.id &&
                        (u.is_active ? (
                          <button className="text-sm text-red-600" onClick={() => deactivate(u.id)}>
                            Deactivate
                          </button>
                        ) : (
                          <button className="text-sm text-accent" onClick={() => reactivate(u.id)}>
                            Reactivate
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
