import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { JobDescriptionSummary } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";

type SortKey = "job_title" | "division" | "function" | "location" | "is_now_hiring" | "updated_at";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "job_title", label: "Job title" },
  { key: "division", label: "Division" },
  { key: "function", label: "Function" },
  { key: "location", label: "Location" },
  { key: "is_now_hiring", label: "Status" },
  { key: "updated_at", label: "Last updated" },
];

export function JobDescriptionsListPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("job_title");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error } = useQuery({
    queryKey: ["job-descriptions", search, includeArchived],
    queryFn: () =>
      api.get<JobDescriptionSummary[]>(
        `/job-descriptions?search=${encodeURIComponent(search)}${includeArchived ? "&includeArchived=true" : ""}`,
      ),
  });

  const rows = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => {
      if (sortKey === "is_now_hiring") {
        const cmp = Number(a.is_now_hiring) - Number(b.is_now_hiring);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const av = (a[sortKey] ?? "").toString().toLowerCase();
      const bv = (b[sortKey] ?? "").toString().toLowerCase();
      const cmp = av.localeCompare(bv);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [data, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1 gap-3">
        <h1 className="font-display font-bold text-xl">Job Descriptions</h1>
        {user?.capabilities.includes("jobdescription.create") && (
          <Link to="/job-descriptions/new" className="btn-primary">
            New job description
          </Link>
        )}
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Candidate-facing recruitment postings, generated from a Job Profile + a Location.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by title, division, function, location…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {user?.capabilities.includes("jobdescription.create") && (
          <label className="flex items-center gap-2 text-sm text-ink-muted whitespace-nowrap">
            <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
            Include archived
          </label>
        )}
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Couldn't load job descriptions.</p>}

      {data && rows.length === 0 && <p className="text-sm text-ink-muted">No job descriptions found.</p>}

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
              {rows.map((jd) => (
                <tr key={jd.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-2">
                    <Link to={`/job-descriptions/${jd.id}`} className="text-accent font-medium hover:underline">
                      {jd.job_title}
                    </Link>
                    {jd.is_archived && (
                      <span className="ml-2 text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
                        Archived
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{jd.division || "—"}</td>
                  <td className="px-4 py-2 text-ink-muted">{jd.function || "—"}</td>
                  <td className="px-4 py-2 text-ink-muted">{jd.location}</td>
                  <td className="px-4 py-2">
                    {jd.is_now_hiring ? (
                      <span className="text-xs rounded bg-accent-soft border border-accent/30 px-1.5 py-0.5 text-accent font-medium whitespace-nowrap">
                        Now Hiring
                      </span>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{jd.updated_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
