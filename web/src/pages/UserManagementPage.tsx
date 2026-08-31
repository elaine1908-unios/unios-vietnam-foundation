import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { User, UserRole } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";

export function UserManagementPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  async function setRole(id: string, role: UserRole) {
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

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Couldn't load users.</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="font-display font-bold text-xl mb-1">User management</h1>
      <p className="text-sm text-ink-muted mb-4">
        New accounts are created automatically on first Microsoft sign-in, as Team Member. Promote them to Team Lead
        here.
      </p>
      <div className="card !p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
              <th className="px-4 py-2 font-medium">Name</th>
              <th className="px-4 py-2 font-medium">Email</th>
              <th className="px-4 py-2 font-medium">Role</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-2">{u.name}</td>
                <td className="px-4 py-2 text-ink-muted">{u.email}</td>
                <td className="px-4 py-2">
                  <select
                    className="input !w-auto py-1"
                    value={u.role}
                    onChange={(e) => setRole(u.id, e.target.value as UserRole)}
                  >
                    <option value="team_lead">Team Lead</option>
                    <option value="team_member">Team Member</option>
                  </select>
                </td>
                <td className="px-4 py-2 text-ink-muted">{u.is_active ? "Active" : "Deactivated"}</td>
                <td className="px-4 py-2 text-right">
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
  );
}
