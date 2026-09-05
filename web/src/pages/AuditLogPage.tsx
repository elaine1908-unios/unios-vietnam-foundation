import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { AuditLogEntry } from "../lib/types";

const ENTITY_TYPES = [
  { value: "", label: "All" },
  { value: "job_profile", label: "Job Profiles" },
  { value: "career_map_role", label: "Career Map" },
  { value: "job_description", label: "Job Descriptions" },
  { value: "employee", label: "Employee Master" },
  { value: "user", label: "Users" },
];

function formatDate(value: string): string {
  return new Date(`${value.replace(" ", "T")}Z`).toLocaleString();
}

export function AuditLogPage() {
  const [entityType, setEntityType] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["audit-log", entityType],
    queryFn: () => api.get<AuditLogEntry[]>(`/audit-log${entityType ? `?entityType=${entityType}` : ""}`),
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display font-bold text-xl mb-1">Audit log</h1>
      <p className="text-sm text-ink-muted mb-4">
        Every change to a Job Profile, Career Map role, Job Description, or user account — who, what, and when.
      </p>
      <select className="input !w-auto mb-4" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
        {ENTITY_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {isLoading && <p className="text-sm text-ink-muted">Loading…</p>}
      {(error || !data) && !isLoading && <p className="text-sm text-red-600">Couldn't load the audit log.</p>}
      {data && (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">Entity</th>
                  <th className="px-3 py-2 font-medium">Change</th>
                  <th className="px-3 py-2 font-medium">By</th>
                </tr>
              </thead>
              <tbody>
                {data.length === 0 && (
                  <tr>
                    <td className="px-3 py-3 text-ink-muted" colSpan={4}>
                      No entries yet.
                    </td>
                  </tr>
                )}
                {data.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0 align-top">
                    <td className="px-3 py-2 text-ink-muted whitespace-nowrap">{formatDate(e.changed_at)}</td>
                    <td className="px-3 py-2 text-ink-muted">{e.entity_type}</td>
                    <td className="px-3 py-2">
                      {e.field_name ? (
                        <>
                          <span className="font-medium">{e.field_name}</span>: {e.old_value ?? "—"} →{" "}
                          {e.new_value ?? "—"}
                        </>
                      ) : (
                        e.action
                      )}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">{e.changed_by_name ?? "—"}</td>
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
