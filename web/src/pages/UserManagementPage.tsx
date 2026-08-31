import { FormEvent, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { User, UserRole } from "../lib/types";
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
  const [title, setTitle] = useState("");
  const [role, setRole] = useState<UserRole>("team_lead");
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await api.post("/users", { name, email, password, role, title: title || undefined });
      setName("");
      setEmail("");
      setPassword("");
      setTitle("");
      setRole("team_lead");
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  async function editTitle(id: string, currentTitle: string | null) {
    const next = prompt("Display title (optional, e.g. \"Owner\") — leave blank to just show the role:", currentTitle ?? "");
    if (next === null) return;
    try {
      await api.patch(`/users/${id}/title`, { title: next });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function setRoleFor(id: string, role: UserRole) {
    try {
      await api.patch(`/users/${id}/role`, { role });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function setActive(id: string, is_active: boolean) {
    try {
      await api.patch(`/users/${id}/active`, { is_active });
      await queryClient.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function resetPassword(id: string, name: string) {
    const newPassword = prompt(`New password for ${name} (min. 8 characters):`);
    if (!newPassword) return;
    try {
      await api.patch(`/users/${id}/password`, { password: newPassword });
      alert("Password updated.");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-bold text-xl mb-1">User management</h1>
      <p className="text-sm text-ink-muted mb-4">
        Accounts are created manually here, not via self-service sign-up. Give each person their initial password
        directly — they can ask a Team Lead to reset it any time via "Reset password" below. Title is an optional
        display label (e.g. "Owner") shown next to someone's name instead of their role — it's cosmetic and doesn't
        change their permissions.
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
        <select className="input" value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
          <option value="team_lead">Team Lead</option>
          <option value="team_member">Team Member</option>
        </select>
        <input
          className="input sm:col-span-2"
          placeholder='Display title (optional, e.g. "Owner") — defaults to the role above'
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
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
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Title</th>
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
                      value={u.role}
                      onChange={(e) => setRoleFor(u.id, e.target.value as UserRole)}
                    >
                      <option value="team_lead">Team Lead</option>
                      <option value="team_member">Team Member</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button className="text-ink-muted hover:text-ink" onClick={() => editTitle(u.id, u.title)}>
                      {u.title ?? <span className="text-ink-faint">—</span>}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-ink-muted">{u.is_active ? "Active" : "Deactivated"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button className="text-sm text-accent mr-3" onClick={() => resetPassword(u.id, u.name)}>
                      Reset password
                    </button>
                    {u.id !== me?.id && (
                      <button className="text-sm text-red-600" onClick={() => setActive(u.id, !u.is_active)}>
                        {u.is_active ? "Deactivate" : "Reactivate"}
                      </button>
                    )}
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
