import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeSummary } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";
import { employeeDisplayName } from "../lib/vietnamese";

type SortKey = "employee_code" | "name" | "department" | "is_archived";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "employee_code", label: "Employee ID" },
  { key: "name", label: "Name" },
  { key: "department", label: "Department" },
  { key: "is_archived", label: "Status" },
];

export function EmployeeMasterListPage() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const { data, isLoading, error } = useQuery({
    queryKey: ["employees", search, includeArchived],
    queryFn: () =>
      api.get<EmployeeSummary[]>(`/employees?search=${encodeURIComponent(search)}${includeArchived ? "&includeArchived=true" : ""}`),
  });

  const rows = useMemo(() => {
    return [...(data ?? [])].sort((a, b) => {
      if (sortKey === "is_archived") {
        const cmp = Number(a.is_archived) - Number(b.is_archived);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const pick = (e: EmployeeSummary) =>
        sortKey === "name"
          ? employeeDisplayName(e)
          : sortKey === "employee_code"
            ? e.employee_code ?? ""
            : e.department ?? "";
      const av = pick(a).toLowerCase();
      const bv = pick(b).toLowerCase();
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

  const canCreate = user?.capabilities.includes("employee.create") ?? false;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1 gap-3">
        <h1 className="font-display font-bold text-xl">Employee Master</h1>
        {canCreate && (
          <div className="flex gap-2">
            <Link to="/employees/import" className="btn-secondary">
              Import employees
            </Link>
            <Link to="/employees/new" className="btn-primary">
              New employee
            </Link>
          </div>
        )}
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Per-employee HR records — owner-only for now, holds sensitive personal data.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <input
          className="input max-w-xs"
          placeholder="Search by name or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-ink-muted whitespace-nowrap">
          <input type="checkbox" checked={includeArchived} onChange={(e) => setIncludeArchived(e.target.checked)} />
          Include archived
        </label>
      </div>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {error && <p className="text-sm text-red-600">Couldn't load employees.</p>}

      {data && rows.length === 0 && <p className="text-sm text-ink-muted">No employees found.</p>}

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
              {rows.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-surface-2">
                  <td className="px-4 py-2 font-mono text-xs text-ink-muted">{e.employee_code || "—"}</td>
                  <td className="px-4 py-2">
                    <Link to={`/employees/${e.id}`} className="text-accent font-medium hover:underline">
                      {employeeDisplayName(e)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{e.department || "—"}</td>
                  <td className="px-4 py-2">
                    {e.is_archived ? (
                      <span className="text-xs rounded bg-surface-2 border border-border px-1.5 py-0.5 text-ink-faint">
                        Archived
                      </span>
                    ) : (
                      <span className="text-xs rounded bg-accent-soft border border-accent/30 px-1.5 py-0.5 text-accent font-medium">
                        On-going
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
