import type { AlDetails, BtDetails, OtDetails, RequestRecord, RequestStatus } from "./types";
import { REQUEST_STATUS_LABELS } from "./types";

// One line describing what the request is for — the "Details" and
// "Date/Period" columns on My Requests/Manage/Approvals, since AL/OT/BT
// don't share a common date field. Shared across every page that lists
// requests, so the same request always reads the same way everywhere.
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
