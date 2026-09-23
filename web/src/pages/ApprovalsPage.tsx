import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { RequestRecord } from "../lib/types";
import { REQUEST_TYPE_LABELS } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";
import { StatusBadge, requestPeriod, requestSummary } from "../lib/requestDisplay";

export function ApprovalsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", "approvals"],
    queryFn: () => api.get<RequestRecord[]>("/requests/approvals"),
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">Couldn't load approvals.</p>;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display font-bold text-xl mb-1">Approvals</h1>
      <p className="text-sm text-ink-muted mb-4">
        AL, OT & BT requests awaiting your decision — from your direct reports, or company-wide if you're Admin/BOD.
      </p>
      {!data || data.length === 0 ? (
        <p className="text-sm text-ink-muted">Nothing awaiting your decision right now.</p>
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
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <Link to={`/requests/${r.id}`} className="text-accent hover:underline font-mono text-xs">
                        {r.request_code}
                      </Link>
                    </td>
                    <td className="px-3 py-2">{r.employee ? employeeDisplayName(r.employee) : "—"}</td>
                    <td className="px-3 py-2">{REQUEST_TYPE_LABELS[r.type]}</td>
                    <td className="px-3 py-2 text-ink-muted">{requestPeriod(r)}</td>
                    <td className="px-3 py-2 text-ink-muted">{requestSummary(r)}</td>
                    <td className="px-3 py-2">
                      <StatusBadge status={r.status} />
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
