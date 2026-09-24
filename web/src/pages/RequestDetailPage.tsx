import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { AlDetails, BtDetails, OtDetails, RequestRecord } from "../lib/types";
import { REQUEST_TYPE_LABELS } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";
import { ALRequestForm, BTRequestForm, OTRequestForm, ConfirmAlSubmitModal, calcAlDays } from "../components/RequestForms";
import type { AlBalance } from "../components/RequestForms";
import { StatusBadge, requestPeriod } from "../lib/requestDisplay";

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex border-b border-border last:border-0">
      <div className="w-56 shrink-0 bg-surface-2 px-3 py-2 text-sm font-medium">{label}</div>
      <div className="px-3 py-2 text-sm whitespace-pre-wrap">{value ?? "—"}</div>
    </div>
  );
}

function DetailFields({ r }: { r: RequestRecord }) {
  if (!r.detail) return null;
  if (r.type === "AL") {
    const d = r.detail as AlDetails;
    return (
      <>
        <InfoRow label="Leave Type" value={d.leave_type} />
        <InfoRow label="Reason" value={d.reason} />
        <InfoRow label="Start Date" value={d.start_date} />
        <InfoRow label="Return to Work Date" value={d.return_to_work_date} />
        <InfoRow label="Leave Duration" value={d.duration} />
        <InfoRow label="Days Requested" value={d.days_requested} />
      </>
    );
  }
  if (r.type === "OT") {
    const d = r.detail as OtDetails;
    return (
      <>
        <InfoRow label="OT Date" value={d.ot_date} />
        <InfoRow label="Start Time" value={d.start_time} />
        <InfoRow label="End Time" value={d.end_time} />
        <InfoRow label="Break Time" value={`${d.break_minutes} min`} />
        <InfoRow label="Total OT Hours" value={d.total_hours} />
        <InfoRow label="Reason / Work Description" value={d.reason} />
        <InfoRow label="Project / Department" value={d.project_department} />
        <InfoRow label="Location" value={d.location} />
      </>
    );
  }
  const d = r.detail as BtDetails;
  return (
    <>
      <InfoRow label="Destination" value={d.destination} />
      <InfoRow label="Purpose of Trip" value={d.purpose} />
      <InfoRow label="Departure Date & Time" value={d.departure_at.replace("T", " ")} />
      <InfoRow label="Return Date & Time" value={d.return_at.replace("T", " ")} />
      <InfoRow label="Number of Days" value={d.days_requested} />
      <InfoRow label="Project / Client" value={d.project_client} />
      <InfoRow label="Transportation Required" value={d.transportation_required ? "Yes" : "No"} />
      <InfoRow label="Hotel Required" value={d.hotel_required ? "Yes" : "No"} />
      <InfoRow label="Advance Payment Required" value={d.advance_payment_required ? "Yes" : "No"} />
      {d.advance_payment_required && (
        <>
          <InfoRow label="Requested Amount" value={d.advance_amount} />
          <InfoRow label="Currency" value={d.advance_currency} />
          <InfoRow label="Notes / Estimated Expenses" value={d.advance_notes} />
        </>
      )}
      <InfoRow label="Additional Notes" value={d.additional_notes} />
    </>
  );
}

const ACTION_LABELS: Record<string, string> = {
  created: "Created",
  submitted: "Submitted",
  approved: "Approved",
  rejected: "Rejected",
  returned_for_edit: "Returned for Edit",
  cancelled: "Cancelled",
  cancellation_requested: "Cancellation Requested",
  cancellation_confirmed: "Cancellation Confirmed",
  cancellation_denied: "Cancellation Denied",
};

export function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [decisionComment, setDecisionComment] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [alConfirmOpen, setAlConfirmOpen] = useState(false);
  const [alBalance, setAlBalance] = useState<AlBalance | null>(null);
  const [alBalanceError, setAlBalanceError] = useState<string | null>(null);

  const { data: r, isLoading, error } = useQuery({
    queryKey: ["requests", id],
    queryFn: () => api.get<RequestRecord>(`/requests/${id}`),
    enabled: Boolean(id),
  });

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ["requests", id] });
    await queryClient.invalidateQueries({ queryKey: ["requests", "mine"] });
    await queryClient.invalidateQueries({ queryKey: ["requests", "approvals"] });
  }

  async function saveDraft(payload: Record<string, unknown>) {
    setSaving(true);
    setFormError(null);
    try {
      await api.patch(`/requests/${id}`, payload);
      await refresh();
      setEditing(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function saveAndSubmit(payload: Record<string, unknown>) {
    setSubmitting(true);
    setFormError(null);
    try {
      await api.patch(`/requests/${id}`, payload);
      await api.post(`/requests/${id}/submit`);
      await refresh();
      setEditing(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  async function doSubmit() {
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/requests/${id}/submit`);
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Same "confirm with balance" step as a brand-new AL submission (see
  // ConfirmAlSubmitModal in RequestForms.tsx) — this is the other entry
  // point into the same server action (POST /:id/submit), submitting an
  // already-saved draft/needs_changes request as-is without re-entering
  // edit mode. Only Annual Leave draws from the balance; every other type
  // (and every other AL leave_type) submits directly, same as before.
  async function handleSubmitClick() {
    if (!r) return;
    const isAnnualLeave = r.type === "AL" && (r.detail as AlDetails | null)?.leave_type === "Annual Leave";
    if (!isAnnualLeave) {
      await doSubmit();
      return;
    }
    setAlConfirmOpen(true);
    setAlBalance(null);
    setAlBalanceError(null);
    try {
      const detail = r.detail as AlDetails;
      const year = detail.start_date.slice(0, 4);
      const result = await api.get<AlBalance>(`/requests/al-balance?year=${year}`);
      setAlBalance(result);
    } catch (err) {
      setAlBalanceError(err instanceof ApiError ? err.message : "something went wrong");
    }
  }

  async function decide(action: "approve" | "reject" | "return_for_edit") {
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/requests/${id}/decide`, { action, comment: decisionComment });
      setDecisionComment("");
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/requests/${id}/cancel`, { reason: cancelReason });
      setCancelReason("");
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function decideCancellation(confirm: boolean) {
    setBusy(true);
    setActionError(null);
    try {
      await api.post(`/requests/${id}/decide-cancellation`, { confirm });
      await refresh();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !r) return <p className="text-sm text-red-600">Couldn't load this request.</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/requests/mine" className="text-sm text-accent hover:underline">
        ← My Requests
      </Link>
      <div className="flex items-center justify-between mt-1 mb-4 gap-3">
        <div>
          <h1 className="font-display font-bold text-xl">{r.request_code ?? "Draft"}</h1>
          <p className="text-sm text-ink-muted mt-0.5">
            {REQUEST_TYPE_LABELS[r.type]} · {requestPeriod(r)}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>

      {editing ? (
        <>
          {r.type === "AL" && (
            <ALRequestForm
              initial={r.detail as AlDetails}
              saving={saving}
              submitting={submitting}
              error={formError}
              onSaveDraft={saveDraft}
              onSubmit={saveAndSubmit}
              onCancelEdit={() => setEditing(false)}
            />
          )}
          {r.type === "OT" && (
            <OTRequestForm
              initial={r.detail as OtDetails}
              saving={saving}
              submitting={submitting}
              error={formError}
              onSaveDraft={saveDraft}
              onSubmit={saveAndSubmit}
              onCancelEdit={() => setEditing(false)}
            />
          )}
          {r.type === "BT" && (
            <BTRequestForm
              initial={r.detail as BtDetails}
              saving={saving}
              submitting={submitting}
              error={formError}
              onSaveDraft={saveDraft}
              onSubmit={saveAndSubmit}
              onCancelEdit={() => setEditing(false)}
            />
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <h2 className="bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md">Request Details</h2>
            <div className="border border-t-0 border-border rounded-b-md">
              <InfoRow label="Employee" value={r.employee ? employeeDisplayName(r.employee) : "—"} />
              <InfoRow label="Approver" value={r.approver ? employeeDisplayName(r.approver) : "—"} />
              <InfoRow label="Submitted" value={r.submitted_at} />
              <DetailFields r={r} />
              {r.decision_comment && <InfoRow label="Decision Comment" value={r.decision_comment} />}
              {r.cancellation_reason && <InfoRow label="Cancellation Reason" value={r.cancellation_reason} />}
            </div>
          </div>

          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}

          <div className="flex flex-wrap gap-2 mb-6">
            {r.viewer.can_edit && (
              <button className="btn-secondary" onClick={() => setEditing(true)} type="button">
                Edit
              </button>
            )}
            {r.viewer.can_submit && !editing && (
              <button className="btn-primary" disabled={busy} onClick={handleSubmitClick} type="button">
                Submit
              </button>
            )}
            {r.viewer.can_cancel && r.status === "approved" && (
              <div className="flex items-end gap-2">
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium">Reason for cancellation</span>
                  <input className="input" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                </label>
                <button className="rounded-md border border-red-300 text-red-600 px-3 py-2 text-sm hover:bg-red-50" disabled={busy} onClick={cancel} type="button">
                  Request Cancellation
                </button>
              </div>
            )}
            {r.viewer.can_cancel && r.status !== "approved" && (
              <button className="rounded-md border border-red-300 text-red-600 px-3 py-2 text-sm hover:bg-red-50" disabled={busy} onClick={cancel} type="button">
                Cancel Request
              </button>
            )}
          </div>

          {r.viewer.can_decide && (
            <div className="card !p-4 mb-6">
              <h2 className="font-display font-semibold mb-2">Decision</h2>
              <label className="flex flex-col gap-1 text-sm mb-3">
                <span className="font-medium">Comment (required for Reject / Return for Edit)</span>
                <textarea className="input" rows={2} value={decisionComment} onChange={(e) => setDecisionComment(e.target.value)} />
              </label>
              <div className="flex gap-2">
                <button className="btn-primary" disabled={busy} onClick={() => decide("approve")} type="button">
                  Approve
                </button>
                <button className="rounded-md border border-red-300 text-red-600 px-3 py-2 text-sm hover:bg-red-50" disabled={busy} onClick={() => decide("reject")} type="button">
                  Reject
                </button>
                <button className="btn-secondary" disabled={busy} onClick={() => decide("return_for_edit")} type="button">
                  Return for Edit
                </button>
              </div>
            </div>
          )}

          {r.viewer.can_decide_cancellation && (
            <div className="card !p-4 mb-6">
              <h2 className="font-display font-semibold mb-2">Cancellation Requested</h2>
              <p className="text-sm text-ink-muted mb-3">{r.cancellation_reason}</p>
              <div className="flex gap-2">
                <button className="btn-primary" disabled={busy} onClick={() => decideCancellation(true)} type="button">
                  Confirm Cancellation
                </button>
                <button className="btn-secondary" disabled={busy} onClick={() => decideCancellation(false)} type="button">
                  Deny (Keep Approved)
                </button>
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display font-semibold mb-2">Approval History</h2>
            <ul className="flex flex-col gap-2">
              {r.history.map((h) => (
                <li key={h.id} className="text-sm border-b border-border pb-2 last:border-0">
                  <span className="font-medium">{ACTION_LABELS[h.action] ?? h.action}</span>{" "}
                  <span className="text-ink-muted">
                    by {h.changed_by_name ?? "—"} on {h.changed_at}
                  </span>
                  {h.new_value && <p className="text-ink-muted mt-0.5">"{h.new_value}"</p>}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
      <button className="text-sm text-ink-muted hover:text-ink mt-6" onClick={() => navigate(-1)} type="button">
        ← Back
      </button>
      {alConfirmOpen && r?.type === "AL" && (
        <ConfirmAlSubmitModal
          days={calcAlDays(
            (r.detail as AlDetails).start_date,
            (r.detail as AlDetails).return_to_work_date,
            (r.detail as AlDetails).duration,
          )}
          balance={alBalance}
          balanceError={alBalanceError}
          submitting={busy}
          onCancel={() => setAlConfirmOpen(false)}
          onConfirm={async () => {
            setAlConfirmOpen(false);
            await doSubmit();
          }}
        />
      )}
    </div>
  );
}
