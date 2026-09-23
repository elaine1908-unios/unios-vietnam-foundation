import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { RequestRecord, RequestStatus, RequestType } from "../lib/types";
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from "../lib/types";
import { requestPeriod, requestSummary, StatusBadge } from "../lib/requestDisplay";
import { employeeDisplayName } from "../lib/vietnamese";

const TYPES: RequestType[] = ["AL", "OT", "BT"];

export function MyRequestsPage() {
  const [typeFilter, setTypeFilter] = useState<RequestType | "">("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");

  const { data, isLoading } = useQuery({
    queryKey: ["requests", "mine"],
    queryFn: () => api.get<RequestRecord[]>("/requests"),
  });

  const rows = useMemo(() => {
    let filtered = data ?? [];
    if (typeFilter) filtered = filtered.filter((r) => r.type === typeFilter);
    if (statusFilter) filtered = filtered.filter((r) => r.status === statusFilter);
    return filtered;
  }, [data, typeFilter, statusFilter]);

  return (
    <div className="max-w-5xl">
      <h1 className="font-display font-bold text-xl mb-1">My Requests</h1>
      <p className="text-sm text-ink-muted mb-4">Every Annual Leave, Overtime, and Business Trip request you've submitted.</p>

      <div className="flex flex-wrap items-center gap-3 mb-3">
        <select className="input !w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as RequestType | "")}>
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

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {!isLoading && rows.length === 0 && <p className="text-sm text-ink-muted">No requests yet.</p>}
      {!isLoading && rows.length > 0 && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                  <th className="px-3 py-2 font-medium">Request ID</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Date/Period</th>
                  <th className="px-3 py-2 font-medium">Details</th>
                  <th className="px-3 py-2 font-medium">Submitted</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Approver</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <Link to={`/requests/${r.id}`} className="text-accent hover:underline font-mono text-xs">
                        {r.request_code ?? "(draft)"}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{REQUEST_TYPE_LABELS[r.type]}</td>
                    <td className="px-3 py-2 text-ink-muted">{requestPeriod(r)}</td>
                    <td className="px-3 py-2 text-ink-muted">{requestSummary(r)}</td>
                    <td className="px-3 py-2 text-ink-muted">{r.submitted_at?.slice(0, 10) ?? "—"}</td>
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
