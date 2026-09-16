import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { AlDetails, BtDetails, OtDetails, RequestRecord, RequestStatus, RequestType } from "../lib/types";
import { REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from "../lib/types";
import { ALRequestForm, BTRequestForm, OTRequestForm } from "../components/RequestForms";
import { employeeDisplayName } from "../lib/vietnamese";

const TABS: RequestType[] = ["AL", "OT", "BT"];

// One line describing what the request is for — the "Details" and
// "Date/Period" columns on My Requests, since AL/OT/BT don't share a common
// date field.
export function requestPeriod(r: RequestRecord): string {
  if (!r.detail) return "—";
  if (r.type === "AL") {
    const d = r.detail as AlDetails;
    return d.start_date === d.return_to_work_date ? d.start_date : `${d.start_date} → ${d.return_to_work_date}`;
  }
  if (r.type === "OT") {
    const d = r.detail as OtDetails;
    return `${d.ot_date} ${d.start_time}–${d.end_time}`;
  }
  const d = r.detail as BtDetails;
  return `${d.departure_at.slice(0, 10)} → ${d.return_at.slice(0, 10)}`;
}

export function requestSummary(r: RequestRecord): string {
  if (!r.detail) return "—";
  if (r.type === "AL") {
    const d = r.detail as AlDetails;
    return `${d.leave_type} · ${d.days_requested} day(s)`;
  }
  if (r.type === "OT") {
    const d = r.detail as OtDetails;
    return `${d.total_hours}h · ${d.location}`;
  }
  const d = r.detail as BtDetails;
  return `${d.destination} · ${d.days_requested} day(s)`;
}

export function StatusBadge({ status }: { status: RequestStatus }) {
  const styles: Record<RequestStatus, string> = {
    draft: "bg-surface-2 text-ink-muted border-border",
    pending_approval: "bg-status-info-soft text-status-info border-status-info/30",
    approved: "bg-status-positive-soft text-status-positive border-status-positive/30",
    rejected: "bg-status-critical-soft text-status-critical border-status-critical/30",
    needs_changes: "bg-status-warning-soft text-status-warning border-status-warning/30",
    cancellation_requested: "bg-status-warning-soft text-status-warning border-status-warning/30",
    cancelled: "bg-surface-2 text-ink-faint border-border",
  };
  return (
    <span className={`text-xs rounded-full border px-2 py-0.5 font-medium ${styles[status]}`}>
      {REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

export function RequestsPage() {
  const [tab, setTab] = useState<RequestType>("AL");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<RequestType | "">("");
  const [statusFilter, setStatusFilter] = useState<RequestStatus | "">("");
  const queryClient = useQueryClient();

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

  async function saveDraft(payload: Record<string, unknown>) {
    setSaving(true);
    setError(null);
    try {
      await api.post("/requests", { type: tab, ...payload });
      await queryClient.invalidateQueries({ queryKey: ["requests", "mine"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function submitNew(payload: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post<RequestRecord>("/requests", { type: tab, ...payload });
      await api.post(`/requests/${created.id}/submit`);
      await queryClient.invalidateQueries({ queryKey: ["requests", "mine"] });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="font-display font-bold text-xl mb-1">Submit AL, OT & BT</h1>
      <p className="text-sm text-ink-muted mb-4">Submit an Annual Leave, Overtime, or Business Trip request.</p>

      <div className="flex gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              tab === t ? "border-accent bg-accent-soft text-accent font-medium" : "border-border text-ink-muted hover:bg-surface-2"
            }`}
            onClick={() => {
              setTab(t);
              setError(null);
            }}
            type="button"
          >
            {REQUEST_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === "AL" && (
        <ALRequestForm saving={saving} submitting={submitting} error={error} onSaveDraft={saveDraft} onSubmit={submitNew} />
      )}
      {tab === "OT" && (
        <OTRequestForm saving={saving} submitting={submitting} error={error} onSaveDraft={saveDraft} onSubmit={submitNew} />
      )}
      {tab === "BT" && (
        <BTRequestForm saving={saving} submitting={submitting} error={error} onSaveDraft={saveDraft} onSubmit={submitNew} />
      )}

      <h2 className="font-display font-bold text-lg mt-8 mb-3">My Requests</h2>
      <div className="flex flex-wrap items-center gap-3 mb-3">
        <select className="input !w-auto" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as RequestType | "")}>
          <option value="">All types</option>
          {TABS.map((t) => (
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
