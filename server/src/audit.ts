import { db } from "./db.js";
import { newId } from "./ids.js";

export type AuditAction = "created" | "updated" | "archived" | "restored" | "role_changed" | "deactivated" | "reactivated";

export function logAudit(entityType: string, entityId: string, action: AuditAction, changedBy: string | undefined) {
  db.prepare(
    "INSERT INTO audit_log (id, entity_type, entity_id, action, changed_by) VALUES (?, ?, ?, ?, ?)",
  ).run(newId(), entityType, entityId, action, changedBy ?? null);
}
