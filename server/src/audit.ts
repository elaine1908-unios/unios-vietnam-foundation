import { db } from "./db.js";
import { newId } from "./ids.js";

export type AuditAction =
  | "created"
  | "updated"
  | "archived"
  | "restored"
  | "role_changed"
  | "deactivated"
  | "reactivated"
  | "password_reset";

export function logAudit(
  entityType: string,
  entityId: string,
  action: AuditAction,
  changedBy: string | undefined,
  fieldName?: string,
  oldValue?: string | null,
  newValue?: string | null,
) {
  db.prepare(
    "INSERT INTO audit_log (id, entity_type, entity_id, action, changed_by, field_name, old_value, new_value) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  ).run(newId(), entityType, entityId, action, changedBy ?? null, fieldName ?? null, oldValue ?? null, newValue ?? null);
}

// One row per changed field — logAudit's `action` is always "updated" here;
// the field_name/old_value/new_value columns carry the actual detail.
export function logFieldChange(
  entityType: string,
  entityId: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null,
  changedBy: string | undefined,
) {
  logAudit(entityType, entityId, "updated", changedBy, fieldName, oldValue, newValue);
}

// Compares each named field between two plain-value snapshots and logs one
// row per field that actually changed. For scalar fields only (job_title,
// division, is_archived, ...) — array-shaped sections (a profile's
// responsibilities, requirements, OKRs, competencies) are wholesale-replaced
// on every save rather than diffed field-by-field, so those are logged by
// the caller as a single "changed" note per section instead (see
// routes/profiles.ts) rather than attempting a structural diff here.
export function diffAndLog(
  entityType: string,
  entityId: string,
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[],
  changedBy: string | undefined,
) {
  for (const field of fields) {
    const oldValue = before[field];
    const newValue = after[field];
    const oldStr = oldValue == null ? null : String(oldValue);
    const newStr = newValue == null ? null : String(newValue);
    if (oldStr !== newStr) {
      logFieldChange(entityType, entityId, field, oldStr, newStr, changedBy);
    }
  }
}
