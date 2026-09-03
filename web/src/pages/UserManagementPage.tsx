import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { User, AccessLevel } from "../lib/types";
import { ACCESS_LEVELS, ACCESS_LEVEL_LABELS } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";

export function UserManagementPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accessLevel, setAccessLevel] = useState<AccessLevel>("team_lead");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/users", { name, email, password, access_level: accessLevel });
      setName("");
      setEmail("");
      setPassword("");
      setAccessLevel("team_lead");
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

  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-bold text-xl mb-1">User management</h1>
      <p className="text-sm text-ink-muted mb-4">
        Accounts are created manually here, not via self-service sign-up. Whoever creates an account (or has their
        password reset) is asked to set their own password on next sign-in.
      </p>

      <form onSubmit={handleCreate} className="card mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          className="input"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
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
        <button className="btn-primary sm:col-span-2" type="submit" disabled={creating}>
          {creating ? "Creating…" : "Create user"}
        </button>
      </form>

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
