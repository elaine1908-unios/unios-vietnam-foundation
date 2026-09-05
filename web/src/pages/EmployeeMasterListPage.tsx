import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeSummary } from "../lib/types";
import { useAuth } from "../auth/AuthProvider";
import { employeeDisplayName } from "../lib/vietnamese";

type SortKey = "employee_code" | "name" | "department" | "rank" | "report_to" | "is_archived";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "employee_code", label: "Employee ID" },
  { key: "name", label: "Name" },
  { key: "department", label: "Department" },
  { key: "rank", label: "Career Rank" },
  { key: "report_to", label: "Report To" },
  { key: "is_archived", label: "Status" },
];

// Has to match the server's check in routes/employees.ts exactly — typing
// this out is the whole point (a click alone shouldn't be enough to wipe
// every employee record).
const DELETE_ALL_CONFIRM_TEXT = "DELETE ALL EMPLOYEE DATA";

export function EmployeeMasterListPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [includeArchived, setIncludeArchived] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
      const pick = (e: EmployeeSummary) => {
        switch (sortKey) {
          case "name":
            return employeeDisplayName(e);
          case "employee_code":
            return e.employee_code ?? "";
          case "department":
            return e.department ?? "";
          case "rank":
            return e.rank ?? "";
          case "report_to":
            return e.report_to_employee ? employeeDisplayName(e.report_to_employee) : "";
          default:
            return "";
        }
      };
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
  const canDelete = user?.capabilities.includes("employee.archive") ?? false;

  async function handleDeleteAll() {
    const typed = window.prompt(
      `This permanently deletes ALL ${data?.length ?? 0} employee record(s) — there is no undo.\n\n` +
        `Type ${DELETE_ALL_CONFIRM_TEXT} to confirm:`,
    );
    if (typed === null) return;
    if (typed !== DELETE_ALL_CONFIRM_TEXT) {
      alert("Text didn't match — nothing was deleted.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.delete("/employees", { confirm: typed });
      await queryClient.invalidateQueries({ queryKey: ["employees"] });
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setDeleting(false);
    }
  }

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
                  <td className="px-4 py-2 text-ink-muted">{e.rank || "—"}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {e.report_to_employee ? (
                      <Link to={`/employees/${e.report_to_employee.id}`} className="hover:underline hover:text-accent">
                        {employeeDisplayName(e.report_to_employee)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
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

      {canDelete && (
        <div className="card !border-red-300 bg-red-50 mt-8">
          <h2 className="font-display font-semibold text-red-800 mb-1">Danger Zone</h2>
          <p className="text-sm text-red-700 mb-3">
            Permanently deletes every employee record — not an archive, there's no undo. Meant for clearing out
            test/botched imports, not day-to-day use.
          </p>
          {deleteError && <p className="text-sm text-red-700 mb-2">{deleteError}</p>}
          <button
            className="rounded-md bg-red-600 text-white text-sm font-medium px-3 py-1.5 hover:bg-red-700 disabled:opacity-50"
            onClick={handleDeleteAll}
            disabled={deleting}
            type="button"
          >
            {deleting ? "Deleting…" : "Delete all employee data"}
          </button>
        </div>
      )}
    </div>
  );
}
