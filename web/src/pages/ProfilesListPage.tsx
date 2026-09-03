import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { ProfileSummary } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";

type SortKey = "job_title" | "rank" | "division" | "function" | "location" | "last_updated";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "job_title", label: "Job title" },
  { key: "rank", label: "Rank" },
  { key: "division", label: "Division" },
  { key: "function", label: "Function" },
  { key: "location", label: "Location" },
  { key: "last_updated", label: "Last updated" },
];

function distinctSorted(values: (string | null)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b),
  );
}

export function ProfilesListPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [divisionFilter, setDivisionFilter] = useState("");
  const [functionFilter, setFunctionFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("job_title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error } = useQuery({
    queryKey: ["profiles", search, includeArchived],
    queryFn: () =>
      api.get<ProfileSummary[]>(
        `/profiles?search=${encodeURIComponent(search)}${includeArchived ? "&includeArchived=true" : ""}`,
      ),
  });

  const divisions = useMemo(() => distinctSorted((data ?? []).map((p) => p.division)), [data]);
  const functions = useMemo(() => distinctSorted((data ?? []).map((p) => p.function)), [data]);

  const rows = useMemo(() => {
    let filtered = data ?? [];
    if (divisionFilter) filtered = filtered.filter((p) => p.division === divisionFilter);
    if (functionFilter) filtered = filtered.filter((p) => p.function === functionFilter);
    return [...filtered].sort((a, b) => {
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, divisionFilter, functionFilter, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-4 gap-3">
        <h1 className="font-display font-bold text-xl">Job Profiles</h1>
        {user?.capabilities.includes("profile.create") && (
          <Link to="/profiles/new" className="btn-primary">
            New profile
          </Link>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by title, rank, division, function, location…"
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
        <select className="input !w-auto" value={functionFilter} onChange={(e) => setFunctionFilter(e.target.value)}>
          <option value="">All functions</option>
          {functions.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        {user?.capabilities.includes("profile.create") && (
          <label className="flex items-center gap-2 text-sm text-ink-muted whitespace-nowrap">
            <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
            Include archived
          </label>
        )}
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Couldn't load profiles.</p>}

      {data && rows.length === 0 && <p className="text-sm text-ink-muted">No profiles found.</p>}

      {data && rows.length > 0 && (
        <div className="card !p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-4 py-2 font-medium">
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
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-2">
                    <Link to={`/profiles/${p.id}`} className="text-accent font-medium hover:underline">
                      {p.job_title}
                    </Link>
                    {p.is_archived && (
                      <span className="ml-2 text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{p.rank || "—"}</td>
                  <td className="px-4 py-2 text-ink-muted">{p.division || "—"}</td>
                  <td className="px-4 py-2 text-ink-muted">{p.function || "—"}</td>
                  <td className="px-4 py-2 text-ink-muted">{p.location || "—"}</td>
                  <td className="px-4 py-2 text-ink-muted">{p.last_updated || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
