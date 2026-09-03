import { FormEvent, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { groupByDivision } from "../lib/careerMap";
import type { CareerMapRole, CareerRankKey } from "../lib/types";
import { CAREER_RANK_LABELS, CAREER_RANK_ORDER } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";

const emptyDraft = { division: "", function: "", rank: "leadership" as CareerRankKey, role_name: "" };

type SortKey = "function" | "role_name" | "rank" | "profile_count";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "function", label: "Function" },
  { key: "role_name", label: "Role name" },
  { key: "rank", label: "Rank" },
  { key: "profile_count", label: "In use" },
];

function distinctSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) => a.localeCompare(b));
}

function compareRoles(a: CareerMapRole, b: CareerMapRole, key: SortKey, dir: "asc" | "desc"): number {
  let av: string | number;
  let bv: string | number;
  if (key === "rank") {
    av = CAREER_RANK_ORDER.indexOf(a.rank);
    bv = CAREER_RANK_ORDER.indexOf(b.rank);
  } else if (key === "profile_count") {
    av = a.profile_count ?? 0;
    bv = b.profile_count ?? 0;
  } else {
    av = (a[key] ?? "").toString().toLowerCase();
    bv = (b[key] ?? "").toString().toLowerCase();
  }
  const cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return dir === "asc" ? cmp : -cmp;
}

export function CareerMapPage() {
  const { user } = useAuth();
  const canCreate = user?.capabilities.includes("careerrole.create") ?? false;
  const canEdit = user?.capabilities.includes("careerrole.edit") ?? false;
  const canArchive = user?.capabilities.includes("careerrole.archive") ?? false;
  const queryClient = useQueryClient();
  const [includeArchived, setIncludeArchived] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [rankFilter, setRankFilter] = useState<CareerRankKey | "">("");
  const [sortKey, setSortKey] = useState<SortKey>("role_name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["career-map", includeArchived],
    queryFn: () => api.get<CareerMapRole[]>(`/career-map${includeArchived ? "?includeArchived=true" : ""}`),
  });

  const divisions = useMemo(() => distinctSorted(roles.map((r) => r.division)), [roles]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    let filtered = roles;
    if (term) {
      filtered = filtered.filter((r) =>
        [r.division, r.function, r.role_name].some((v) => v?.toLowerCase().includes(term)),
      );
    }
    if (divisionFilter) filtered = filtered.filter((r) => r.division === divisionFilter);
    if (rankFilter) filtered = filtered.filter((r) => r.rank === rankFilter);
    return [...filtered].sort((a, b) => compareRoles(a, b, sortKey, sortDir));
  }, [roles, search, divisionFilter, rankFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft);
    setError(null);
    setShowForm(true);
  }

  function startEdit(role: CareerMapRole) {
    setEditingId(role.id);
    setDraft({ division: role.division, function: role.function ?? "", rank: role.rank, role_name: role.role_name });
    setError(null);
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const body = {
      division: draft.division,
      function: draft.function.trim() || null,
      rank: draft.rank,
      role_name: draft.role_name,
    };
    try {
      if (editingId) {
        await api.patch(`/career-map/${editingId}`, body);
      } else {
        await api.post("/career-map", body);
      }
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: ["career-map"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleArchive(role: CareerMapRole) {
    const archiving = !role.is_archived;
    if (archiving && (role.profile_count ?? 0) > 0) {
      const noun = role.profile_count === 1 ? "profile" : "profiles";
      const ok = confirm(
        `${role.profile_count} job ${noun} currently reference "${role.role_name}". Archiving it won't change those profiles, but it will remove this role from the dropdown for new ones. Archive anyway?`,
      );
      if (!ok) return;
    }
    try {
      await api.post(`/career-map/${role.id}/${archiving ? "archive" : "restore"}`);
      await queryClient.invalidateQueries({ queryKey: ["career-map"] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1 gap-3">
        <h1 className="font-display font-bold text-xl">Career Map</h1>
        {canCreate && (
          <button className="btn-primary" onClick={startCreate}>
            + Add role
          </button>
        )}
      </div>
      <p className="text-sm text-ink-muted mb-4">
        The master list of Unios Vietnam role titles offered when creating a Job Profile. Seeded from the Career Map
        document; add, rename, or archive roles here as the org chart evolves.
      </p>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by division, function, role name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input !w-auto" value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
          <option value="">All divisions</option>
          {divisions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          className="input !w-auto"
          value={rankFilter}
          onChange={(e) => setRankFilter(e.target.value as CareerRankKey | "")}
        >
          <option value="">All ranks</option>
          {CAREER_RANK_ORDER.map((k) => (
            <option key={k} value={k}>
              {CAREER_RANK_LABELS[k]}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink-muted whitespace-nowrap">
          <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Include archived
        </label>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Division</span>
            <input
              className="input"
              required
              value={draft.division}
              onChange={(e) => setDraft((d) => ({ ...d, division: e.target.value }))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Function (optional)</span>
            <input
              className="input"
              value={draft.function}
              onChange={(e) => setDraft((d) => ({ ...d, function: e.target.value }))}
              placeholder="Leave blank for a divisional-leadership role"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Rank</span>
            <select
              className="input"
              value={draft.rank}
              onChange={(e) => setDraft((d) => ({ ...d, rank: e.target.value as CareerRankKey }))}
            >
              {CAREER_RANK_ORDER.map((k) => (
                <option key={k} value={k}>
                  {CAREER_RANK_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Role name</span>
            <input
              className="input"
              required
              value={draft.role_name}
              onChange={(e) => setDraft((d) => ({ ...d, role_name: e.target.value }))}
            />
          </label>
          {error && <p className="text-sm text-red-600 col-span-2">{error}</p>}
          <div className="col-span-2 flex gap-2">
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add role"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}

      {!isLoading && rows.length === 0 && <p className="text-sm text-ink-muted">No roles match your filters.</p>}

      {!isLoading &&
        groupByDivision(rows).map(([division, divisionRoles]) => (
          <div key={division} className="mb-6">
            <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">
              {division}
            </h2>
            <div className="border border-t-0 border-border rounded-b-md overflow-hidden">
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
                    {(canEdit || canArchive) && <th className="px-3 py-2 font-medium"></th>}
                  </tr>
                </thead>
                <tbody>
                  {divisionRoles.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 text-ink-muted">{r.function || "—"}</td>
                      <td className="px-3 py-2">
                        {r.role_name}
                        {r.is_archived && (
                          <span className="ml-2 text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
                            Archived
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-ink-muted">{CAREER_RANK_LABELS[r.rank]}</td>
                      <td className="px-3 py-2 text-ink-muted">
                        {r.profile_count ? `${r.profile_count} profile${r.profile_count === 1 ? "" : "s"}` : "—"}
                      </td>
                      {(canEdit || canArchive) && (
                        <td className="px-3 py-2 text-right whitespace-nowrap">
                          {canEdit && (
                            <button className="text-sm text-accent hover:underline mr-3" onClick={() => startEdit(r)}>
                              Edit
                            </button>
                          )}
                          {canArchive && (
                            <button className="text-sm text-red-600 hover:underline" onClick={() => toggleArchive(r)}>
                              {r.is_archived ? "Restore" : "Archive"}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
    </div>
  );
}
