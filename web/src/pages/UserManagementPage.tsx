import { FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { User, AccessLevel, EmployeeDetail } from "../lib/types";
import { ACCESS_LEVELS, ACCESS_LEVEL_LABELS } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";
import { employeeDisplayName, stripDiacritics } from "../lib/vietnamese";

type SortKey = "name" | "email" | "access_level" | "status";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
  { key: "access_level", label: "Access level" },
  { key: "status", label: "Status" },
];

export function UserManagementPage() {
  const { user: me } = useAuth();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: () => api.get<User[]>("/users"),
  });

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<AccessLevel | "">("");
  // Deactivated accounts stay in the default view (no status filter applied
  // until the admin picks one) — unlike Employee Master's archived
  // employees, a deactivated account is exactly the kind of thing this
  // page exists to keep visible, not hide by default.
  const [statusFilter, setStatusFilter] = useState<"" | "active" | "deactivated">("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const rows = useMemo(() => {
    // Diacritics-insensitive on both sides — u.name is the computed Employee
    // Master display name (see employeeDisplayName), already shown
    // unaccented, but stripping the typed query too means it still matches
    // if someone searches with the accents typed in.
    const q = stripDiacritics(search.trim()).toLowerCase();
    const filtered = (data ?? []).filter((u) => {
      const matchesSearch = !q || stripDiacritics(u.name).toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesLevel = !levelFilter || u.access_level === levelFilter;
      const matchesStatus = !statusFilter || (statusFilter === "active" ? u.is_active : !u.is_active);
      return matchesSearch && matchesLevel && matchesStatus;
    });
    const pick = (u: User) => {
      switch (sortKey) {
        case "name":
          return u.name;
        case "email":
          return u.email;
        case "access_level":
          return ACCESS_LEVEL_LABELS[u.access_level];
        case "status":
          return u.is_active ? "Active" : "Deactivated";
      }
    };
    return [...filtered].sort((a, b) => {
      const cmp = pick(a).toLowerCase().localeCompare(pick(b).toLowerCase());
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, search, levelFilter, statusFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

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

  return (
    <div className="max-w-4xl">
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

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <input
          className="input max-w-xs"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="input w-auto"
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as AccessLevel | "")}
        >
          <option value="">All access levels</option>
          {ACCESS_LEVELS.map((l) => (
            <option key={l} value={l}>
              {ACCESS_LEVEL_LABELS[l]}
            </option>
          ))}
        </select>
        <select
          className="input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "" | "active" | "deactivated")}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {(error || !data) && !isLoading && <p className="text-sm text-red-600">Couldn't load users.</p>}
      {data && rows.length === 0 && <p className="text-sm text-ink-muted">No users found.</p>}
      {data && rows.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                  {COLUMNS.map((col) => (
                    <th key={col.key} className="px-3 py-2 font-medium">
                      <button
                        className="flex items-center gap-1 hover:text-ink"
                        onClick={() => handleSort(col.key)}
                        type="button"
                      >
                        {col.label}
                        {sortKey === col.key && <span>{sortDir === "asc" ? "▲" : "▼"}</span>}
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((u) => (
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
                    <td className="px-3 py-2">
                      {u.is_active ? (
                        <span className="text-xs rounded-full bg-status-positive-soft border border-status-positive/30 px-2 py-0.5 text-status-positive font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs rounded-full bg-status-critical-soft border border-status-critical/30 px-2 py-0.5 text-status-critical font-medium">
                          Deactivated
                        </span>
                      )}
                      {u.must_change_password && u.is_active && (
                        <span className="ml-1 text-xs text-ink-faint">(must change password)</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-col items-start gap-1">
                        <button className="text-sm text-accent" onClick={() => resetPassword(u.id, u.name)}>
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
                      </div>
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
