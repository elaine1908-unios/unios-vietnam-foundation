import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireCap } from "../middleware.js";

export const auditRouter = Router();

// Owner only — this is where an access-level change or a password reset can
// actually be found, rather than only by paging through one entity's own
// audit trail. entityType filters to 'job_profile' | 'career_map_role' |
// 'user' (omit for everything).
auditRouter.use(requireAuth, requireCap("user.admin"));

auditRouter.get("/", (req, res) => {
  const entityType = String(req.query.entityType ?? "").trim();
  const where = entityType ? "WHERE audit_log.entity_type = ?" : "";
  const rows = db
    .prepare(
      `SELECT audit_log.id, audit_log.entity_type, audit_log.entity_id, audit_log.action,
              audit_log.field_name, audit_log.old_value, audit_log.new_value, audit_log.changed_at,
              users.name as changed_by_name, users.email as changed_by_email
       FROM audit_log LEFT JOIN users ON users.id = audit_log.changed_by
       ${where}
       ORDER BY audit_log.changed_at DESC
       LIMIT 500`,
    )
    .all(...(entityType ? [entityType] : []));
  res.json(rows);
});
