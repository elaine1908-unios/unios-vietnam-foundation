import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { RequestManageResponse, RequestStatus, RequestType } from "../lib/types";
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from "../lib/types";
import { requestPeriod, requestSummary, StatusBadge } from "./RequestsPage";
import { employeeDisplayName } from "../lib/vietnamese";
import { useAuth } from "../auth/AuthProvider";

const TYPES: RequestType[] = ["AL", "OT", "BT"];
const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => String(CURRENT_YEAR - i));
const MONTH_OPTIONS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
].map((label, i) => ({ value: String(i + 1), label }));

export function ManageRequestsPage() {
  const { user } = useAuth();
  const canImport = user?.capabilities.includes("request.import") ?? false;

  const [year, setYear] = useState(String(CURRENT_YEAR));
  const [month, setMonth] = useState(""); // "" = whole year
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<RequestType | "">("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", "manage", year, month],
    queryFn: () => api.get<RequestManageResponse>(`/requests/manage?year=${year}${month ? `&month=${month}` : ""}`),
  });

  const departmentOptions = useMemo(() => {
    const set = new Set<string>();
    for (const s of data?.summary ?? []) if (s.department) set.add(s.department);
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [data]);

  // Department isn't on a request row itself — looked up via the same
  // employee_id every summary row and request row already carries, so
  // both tables below filter off the one per-employee department map.
  const departmentByEmployee = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const s of data?.summary ?? []) map.set(s.employee_id, s.department);
    return map;
  }, [data]);

  const summaryRows = useMemo(() => {
    let rows = data?.summary ?? [];
    if (departmentFilter) rows = rows.filter((s) => s.department === departmentFilter);
    return [...rows].sort((a, b) => employeeDisplayName(a.employee).localeCompare(employeeDisplayName(b.employee)));
  }, [data, departmentFilter]);

  const requestRows = useMemo(() => {
    let rows = data?.requests ?? [];
    if (departmentFilter) rows = rows.filter((r) => departmentByEmployee.get(r.employee_id) === departmentFilter);
    if (employeeFilter) rows = rows.filter((r) => r.employee_id === employeeFilter);
    if (typeFilter) rows = rows.filter((r) => r.type === typeFilter);
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter);
    return rows;
  }, [data, departmentFilter, departmentByEmployee, employeeFilter, typeFilter, statusFilter]);

  const selectedEmployee = summaryRows.find((s) => s.employee_id === employeeFilter)?.employee;

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Couldn't load requests.</p>;

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between mb-1 gap-3">
        <h1 className="font-display font-bold text-xl">Manage AL, OT & BT</h1>
        {canImport && (
          <Link
            to="/requests/import"
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-2"
          >
            Import Historical Requests
          </Link>
        )}
      </div>
      <p className="text-sm text-ink-muted mb-4">
        Annual Leave, Overtime, and Business Travel for{" "}
        {summaryRows.length === 1 ? "the 1 person" : `the ${summaryRows.length} people`} you can see.
      </p>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm text-ink-muted" htmlFor="manage-year">
            Year
          </label>
          <select
            id="manage-year"
            className="input !w-auto"
            value={year}
            onChange={(e) => {
              setYear(e.target.value);
              setEmployeeFilter(null);
            }}
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-ink-muted" htmlFor="manage-month">
            Month
          </label>
          <select
            id="manage-month"
            className="input !w-auto"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setEmployeeFilter(null);
            }}
          >
            <option value="">All months</option>
            {MONTH_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-ink-muted" htmlFor="manage-department">
            Department
          </label>
          <select
            id="manage-department"
            className="input !w-auto"
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setEmployeeFilter(null);
            }}
          >
            <option value="">All departments</option>
            {departmentOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {summaryRows.length === 0 ? (
        <p className="text-sm text-ink-muted mb-6">No one in your scope yet.</p>
      ) : (
        <div className="card !p-0 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                  <th className="px-3 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">AL Used / Entitlement</th>
                  <th className="px-3 py-2 font-medium">OT Hours</th>
                  <th className="px-3 py-2 font-medium">Business Travel</th>
                </tr>
              </thead>
              <tbody>
                {summaryRows.map((s) => (
                  <tr
                    key={s.employee_id}
                    onClick={() => setEmployeeFilter((cur) => (cur === s.employee_id ? null : s.employee_id))}
                    className={`border-b border-border last:border-0 cursor-pointer ${
                      employeeFilter === s.employee_id ? "bg-accent-soft" : "hover:bg-surface-2"
                    }`}
                  >
                    <td className="px-3 py-2 text-accent font-medium">{employeeDisplayName(s.employee)}</td>
                    <td className="px-3 py-2 text-ink-muted">
                      {s.al_used} / {s.al_entitlement}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{s.ot_hours.toFixed(1)}</td>
                    <td className="px-3 py-2 text-ink-muted">
                      {s.bt_trips} trip{s.bt_trips === 1 ? "" : "s"} · {s.bt_days} day{s.bt_days === 1 ? "" : "s"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="font-display font-bold text-lg">
          {selectedEmployee ? `Requests — ${employeeDisplayName(selectedEmployee)}` : "All Requests"}
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          {employeeFilter && (
            <button
              className="text-sm text-accent hover:underline"
              onClick={() => setEmployeeFilter(null)}
              type="button"
            >
              Clear employee filter
            </button>
          )}
          <select
            className="input !w-auto"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as RequestType | "")}
          >
            <option value="">All types</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {REQUEST_TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <select
            className="input !w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as RequestStatus | "")}
          >
            <option value="">All statuses</option>
            {Object.entries(REQUEST_STATUS_LABELS).map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {requestRows.length === 0 ? (
        <p className="text-sm text-ink-muted">No requests match these filters.</p>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                  <th className="px-3 py-2 font-medium">Request ID</th>
                  <th className="px-3 py-2 font-medium">Employee</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Date/Period</th>
                  <th className="px-3 py-2 font-medium">Details</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Approver</th>
                </tr>
              </thead>
              <tbody>
                {requestRows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <Link to={`/requests/${r.id}`} className="text-accent hover:underline font-mono text-xs">
                        {r.request_code ?? "(draft)"}
                      </Link>
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{r.employee ? employeeDisplayName(r.employee) : "—"}</td>
                    <td className="px-3 py-2">{REQUEST_TYPE_LABELS[r.type]}</td>
                    <td className="px-3 py-2 text-ink-muted">{requestPeriod(r)}</td>
                    <td className="px-3 py-2 text-ink-muted">{requestSummary(r)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{r.approver ? employeeDisplayName(r.approver) : "—"}</td>
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
