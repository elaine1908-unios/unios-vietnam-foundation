import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { RequestRecord } from "../lib/types";
import { REQUEST_TYPE_LABELS } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";
import { StatusBadge, requestPeriod, requestSummary } from "../lib/requestDisplay";

export function ApprovalsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["requests", "approvals"],
    queryFn: () => api.get<RequestRecord[]>("/requests/approvals"),
  });

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const rows = data ?? [];
  const selectedRows = rows.filter((r) => selected.has(r.id));
  const allSelected = rows.length > 0 && selected.size === rows.length;
  // Delete Selected only ever shows up for an Admin/BOD viewer — everyone
  // else's viewer.can_delete is false on every row here (Approvals only
  // ever lists OTHER people's requests awaiting a decision, and only
  // admin/BOD get an unconditional delete bypass — see can_delete in
  // server/src/routes/requests.ts), so gating purely on this per-row flag
  // already gives the exact "Admin/BOD only" restriction asked for, with
  // no separate role check to keep in sync.
  const canBulkDelete = selectedRows.some((r) => r.viewer.can_delete);

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function refreshLists() {
    await queryClient.invalidateQueries({ queryKey: ["requests", "approvals"] });
    await queryClient.invalidateQueries({ queryKey: ["requests", "manage"] });
    await queryClient.invalidateQueries({ queryKey: ["requests", "mine"] });
  }

  // Every bulk action re-runs each selected request through the exact same
  // per-request endpoint the single-request detail page already uses
  // (POST /:id/decide, DELETE /:id) — same permission checks, validation,
  // and audit logging, just fired once per selected id rather than adding
  // a parallel bulk-specific server code path to keep in sync. Failures
  // are collected rather than aborting the whole batch, since one bad row
  // (e.g. someone else already decided it) shouldn't block the rest.
  async function runBulk(ids: string[], action: (id: string) => Promise<unknown>, verb: string) {
    setBusy(true);
    setActionError(null);
    const results = await Promise.allSettled(ids.map((id) => action(id)));
    const failures = results
      .map((res, i) => (res.status === "rejected" ? { id: ids[i], reason: res.reason } : null))
      .filter((x): x is { id: string; reason: unknown } => x !== null);
    await refreshLists();
    setSelected(new Set());
    setBusy(false);
    if (failures.length > 0) {
      const detail = failures
        .map((f) => `${f.id.slice(0, 8)}…: ${f.reason instanceof ApiError ? f.reason.message : "failed"}`)
        .join("; ");
      setActionError(`${ids.length - failures.length} of ${ids.length} ${verb} succeeded. Failed — ${detail}`);
    }
  }

  // Approvals also lists cancellation_requested rows (an already-approved
  // request the employee has since asked to cancel — see GET
  // /requests/approvals) alongside pending_approval ones, but those go
  // through a completely different endpoint with a completely different
  // shape (POST /:id/decide-cancellation, a plain confirm/deny boolean —
  // no reason, no "approve"/"reject" concept). Approve/Reject Selected
  // only ever act on the pending_approval rows in the current selection;
  // a cancellation_requested row has to be decided individually from its
  // own detail page.
  function pendingSelected(): RequestRecord[] {
    return selectedRows.filter((r) => r.status === "pending_approval");
  }

  async function approveSelected() {
    const targets = pendingSelected();
    if (targets.length === 0) return;
    const skipped = selectedRows.length - targets.length;
    if (
      !window.confirm(
        `Approve ${targets.length} request(s)?${
          skipped ? ` (${skipped} cancellation-request row(s) in your selection will be skipped — decide those individually.)` : ""
        }`,
      )
    )
      return;
    await runBulk(
      targets.map((r) => r.id),
      (id) => api.post(`/requests/${id}/decide`, { action: "approve" }),
      "approvals",
    );
  }

  function startReject() {
    if (pendingSelected().length === 0) return;
    setActionError(null);
    setRejectReason("");
    setRejecting(true);
  }

  async function confirmReject() {
    if (!rejectReason.trim()) {
      setActionError("A reason is required to reject.");
      return;
    }
    const ids = pendingSelected().map((r) => r.id);
    setRejecting(false);
    await runBulk(
      ids,
      (id) => api.post(`/requests/${id}/decide`, { action: "reject", comment: rejectReason.trim() }),
      "rejections",
    );
  }

  async function deleteSelected() {
    const ids = selectedRows.filter((r) => r.viewer.can_delete).map((r) => r.id);
    if (ids.length === 0) return;
    if (!window.confirm(`Permanently delete ${ids.length} request(s)? This can't be undone.`)) return;
    await runBulk(ids, (id) => api.delete(`/requests/${id}`), "deletions");
  }

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">Couldn't load approvals.</p>;

  return (
    <div className="max-w-5xl">
      <h1 className="font-display font-bold text-xl mb-1">Approvals</h1>
      <p className="text-sm text-ink-muted mb-4">
        AL, OT & BT requests awaiting your decision — from your direct reports, or company-wide if you're Admin/BOD.
      </p>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nothing awaiting your decision right now.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {rejecting ? (
              <>
                <label className="flex flex-col gap-1 text-sm flex-1 min-w-[240px]">
                  <span className="font-medium">Reason for rejecting {pendingSelected().length} request(s)</span>
                  <input
                    className="input"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    autoFocus
                  />
                </label>
                <button className="btn-primary" type="button" disabled={busy} onClick={confirmReject}>
                  {busy ? "Rejecting…" : "Confirm Reject"}
                </button>
                <button className="btn-secondary" type="button" disabled={busy} onClick={() => setRejecting(false)}>
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="text-sm text-ink-muted">{selected.size} selected</span>
                <button className="btn-primary" type="button" disabled={busy || pendingSelected().length === 0} onClick={approveSelected}>
                  Approve Selected
                </button>
                <button
                  className="rounded-md border border-red-300 text-red-600 px-3 py-2 text-sm hover:bg-red-50 disabled:opacity-50"
                  type="button"
                  disabled={busy || pendingSelected().length === 0}
                  onClick={startReject}
                >
                  Reject Selected
                </button>
                {canBulkDelete && (
                  <button
                    className="rounded-md border border-red-300 text-red-600 px-3 py-2 text-sm hover:bg-red-50 disabled:opacity-50"
                    type="button"
                    disabled={busy}
                    onClick={deleteSelected}
                  >
                    Delete Selected
                  </button>
                )}
              </>
            )}
          </div>
          {actionError && <p className="text-sm text-red-600 mb-3">{actionError}</p>}

          <div className="card !p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                    <th className="px-3 py-2 font-medium w-8">
                      <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
                    </th>
                    <th className="px-3 py-2 font-medium">Request ID</th>
                    <th className="px-3 py-2 font-medium">Employee</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Date/Period</th>
                    <th className="px-3 py-2 font-medium">Details</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={() => toggleOne(r.id)}
                          aria-label={`Select ${r.request_code ?? r.id}`}
                        />
                      </td>
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
        </>
      )}
    </div>
  );
}
