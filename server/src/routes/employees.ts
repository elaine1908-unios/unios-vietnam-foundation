import { Router } from "express";
import { db } from "../db.js";
import { newId } from "../ids.js";
import { requireCap } from "../middleware.js";
import { logAudit, diffAndLog } from "../audit.js";

export const employeesRouter = Router();

// Owner-only (see capabilities.ts) — this holds sensitive personal data, so
// unlike profiles/career-map/job-descriptions, even read access is gated
// beyond plain requireAuth.
employeesRouter.use(requireCap("employee.view"));

const FIELDS = [
  "work_email",
  "last_name",
  "middle_name",
  "first_name",
  "english_name",
  "department",
  "position",
  "rank",
  "office_location",
  "commencement_date",
  "phone_no",
  "personal_tax_no",
  "bank_account_no",
  "bank_name",
  "gender",
  "marital_status",
  "birthday",
  "id_no",
  "issued_date",
  "issued_at",
  "passport_no",
  "nationality",
  "permanent_address",
  "temporary_address",
  "emergency_contact",
  "relationship",
  "contact_phone_no",
  "contact_address",
  "health_insurance",
] as const;

interface EmployeeInput {
  last_name?: string;
  first_name?: string;
  career_map_role_id?: string | null;
  [key: string]: string | null | undefined;
}

function validate(input: EmployeeInput): string | null {
  if (!input.last_name?.trim()) return "Last name is required.";
  if (!input.first_name?.trim()) return "First name is required.";
  return null;
}

// Department/Position/Rank are set only by picking a Career Map role
// (dropdown, not free text — see 0015_employee_career_map_link.sql), same
// traceability-link pattern as job_profiles.career_map_role_id.
function resolveCareerMapRoleId(rawId: string | null | undefined): string | null | "invalid" {
  if (!rawId) return null;
  const exists = db.prepare("SELECT id FROM career_map_roles WHERE id = ?").get(rawId);
  return exists ? rawId : "invalid";
}

function loadDetail(id: string) {
  const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  const careerMapRole = row.career_map_role_id
    ? (db.prepare("SELECT * FROM career_map_roles WHERE id = ?").get(row.career_map_role_id as string) as
        | Record<string, unknown>
        | undefined)
    : undefined;
  return {
    ...row,
    is_archived: Boolean(row.is_archived),
    career_map_role: careerMapRole ? { ...careerMapRole, is_archived: Boolean(careerMapRole.is_archived) } : null,
  };
}

employeesRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const includeArchived = req.query.includeArchived === "true";
  const clauses: string[] = [];
  const params: string[] = [];
  if (!includeArchived) clauses.push("is_archived = 0");
  if (search) {
    clauses.push("(last_name LIKE ? OR middle_name LIKE ? OR first_name LIKE ? OR english_name LIKE ? OR department LIKE ?)");
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = db
    .prepare(
      `SELECT id, last_name, middle_name, first_name, english_name, department, is_archived
       FROM employees ${where} ORDER BY last_name COLLATE NOCASE, first_name COLLATE NOCASE`,
    )
    .all(...params) as Record<string, unknown>[];
  res.json(rows.map((r) => ({ ...r, is_archived: Boolean(r.is_archived) })));
});

employeesRouter.get("/:id", (req, res) => {
  const row = loadDetail(req.params.id);
  if (!row) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }
  res.json(row);
});

employeesRouter.post("/", requireCap("employee.create"), (req, res) => {
  const input = req.body as EmployeeInput;
  const error = validate(input);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const careerMapRoleId = resolveCareerMapRoleId(input.career_map_role_id);
  if (careerMapRoleId === "invalid") {
    res.status(400).json({ error: "That Career Map role no longer exists." });
    return;
  }
  const id = newId();
  const values = FIELDS.map((f) => input[f]?.toString().trim() || null);
  db.prepare(
    `INSERT INTO employees (id, ${FIELDS.join(", ")}, career_map_role_id, created_by, updated_by) VALUES (?, ${FIELDS.map(() => "?").join(", ")}, ?, ?, ?)`,
  ).run(id, ...values, careerMapRoleId, req.user!.id, req.user!.id);
  logAudit("employee", id, "created", req.user!.id);
  res.status(201).json(loadDetail(id));
});

employeesRouter.patch("/:id", requireCap("employee.edit"), (req, res) => {
  const existing = loadDetail(req.params.id);
  if (!existing) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }
  const input = req.body as EmployeeInput;
  const error = validate(input);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const careerMapRoleId = resolveCareerMapRoleId(input.career_map_role_id);
  if (careerMapRoleId === "invalid") {
    res.status(400).json({ error: "That Career Map role no longer exists." });
    return;
  }
  const values = FIELDS.map((f) => input[f]?.toString().trim() || null);
  db.prepare(
    `UPDATE employees SET ${FIELDS.map((f) => `${f} = ?`).join(", ")}, career_map_role_id = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(...values, careerMapRoleId, req.user!.id, req.params.id);
  const updated = loadDetail(req.params.id)!;
  diffAndLog("employee", req.params.id, existing, updated, [...FIELDS, "career_map_role_id"], req.user!.id);
  res.json(updated);
});

employeesRouter.post("/:id/archive", requireCap("employee.archive"), (req, res) => {
  const result = db.prepare("UPDATE employees SET is_archived = 1 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }
  logAudit("employee", req.params.id, "archived", req.user!.id, "is_archived", "false", "true");
  res.json({ ok: true });
});

employeesRouter.post("/:id/restore", requireCap("employee.archive"), (req, res) => {
  const result = db.prepare("UPDATE employees SET is_archived = 0 WHERE id = ?").run(req.params.id);
  if (result.changes === 0) {
    res.status(404).json({ error: "Employee not found." });
    return;
  }
  logAudit("employee", req.params.id, "restored", req.user!.id, "is_archived", "true", "false");
  res.json({ ok: true });
});
