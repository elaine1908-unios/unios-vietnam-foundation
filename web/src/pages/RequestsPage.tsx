import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../lib/api";
import type { RequestRecord, RequestType } from "../lib/types";
import { REQUEST_TYPE_LABELS } from "../lib/types";
import { ALRequestForm, BTRequestForm, OTRequestForm } from "../components/RequestForms";

const TABS: RequestType[] = ["AL", "OT", "BT"];

export function RequestsPage() {
  const [tab, setTab] = useState<RequestType>("AL");
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // Same query key My Requests uses, so it reflects a just-submitted
  // request immediately if it's already mounted (e.g. a second tab).
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

      <div className="flex items-center gap-2 mb-4">
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
    </div>
  );
}
