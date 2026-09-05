import { Router } from "express";
import { db, transaction } from "../db.js";
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
  "passport_no",
  "nationality",
  "permanent_address",
  "temporary_address",
  "emergency_contact",
  "relationship",
  "contact_phone_no",
  "health_insurance",
  "contract_type",
  "contract_length",
  "contract_no",
  "contract_start_date",
  "contract_end_date",
] as const;

interface EmployeeInput {
  last_name?: string;
  first_name?: string;
  career_map_role_id?: string | null;
  report_to_employee_id?: string | null;
  is_offshore?: boolean;
  [key: string]: string | boolean | null | undefined;
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

// Same dropdown-only, traceability-link pattern as career_map_role_id, but
// pointing at another employees row instead — so a manager change is
// something that can't drift out of sync the way a typed name could.
// `selfId` (only meaningful on edit — a brand-new employee has no id yet to
// collide with) blocks picking yourself as your own manager.
function resolveReportToId(rawId: string | null | undefined, selfId?: string): string | null | "invalid" | "self" {
  if (!rawId) return null;
  if (selfId && rawId === selfId) return "self";
  const exists = db.prepare("SELECT id FROM employees WHERE id = ?").get(rawId);
  return exists ? rawId : "invalid";
}

// UV-<initials>-<MMYY> — e.g. "UV-TT-1121" for a "Tam Tran"-shaped name
// hired November 2021. Computed ONCE at creation from that moment's
// name/commencement_date and never recomputed — like the old sequential
// version, it's an identifier, not a live-derived display value, so
// correcting a typo in someone's name later doesn't change their ID.
//
// Vietnamese names carry diacritics (Ư, Đ, ...) that don't belong in a
// short, universally-typeable code, so the initial is taken from the
// diacritic-stripped form.
function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

function initialOf(name: string | null | undefined): string {
  const letter = stripDiacritics((name ?? "").trim()).charAt(0);
  return (letter || "X").toUpperCase();
}

// Commencement date may not be known yet at creation time (it's an optional
// field) — falls back to today's date rather than leaving the code's date
// segment blank or invalid.
function monthYear(dateStr: string | null | undefined): string {
  const parsed = dateStr ? new Date(dateStr) : null;
  const d = parsed && !isNaN(parsed.getTime()) ? parsed : new Date();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${mm}${yy}`;
}

// Two employees can easily share both initials and hire month (real HR data
// already does — see e.g. a batch of hires all starting "6/3/2024") — a
// numeric suffix on the INITIALS segment disambiguates rather than
// silently colliding on the unique index: 1st = "UV-DN-0624", 2nd =
// "UV-DN2-0624", 3rd = "UV-DN3-0624". Initials are always exactly 2
// letters by construction, so a LIKE match on "UV-<initials>%-<date>" can
// only ever pick up that numeric suffix, never a different person's code.
// Same run-inside-a-transaction safety as before: each INSERT is visible
// to the next row's SELECT within a bulk import.
function generateEmployeeCode(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  commencementDate: string | null | undefined,
): string {
  const initials = `${initialOf(firstName)}${initialOf(lastName)}`;
  const date = monthYear(commencementDate);
  const count = (
    db.prepare("SELECT COUNT(*) as n FROM employees WHERE employee_code LIKE ?").get(`UV-${initials}%-${date}`) as {
      n: number;
    }
  ).n;
  return count === 0 ? `UV-${initials}-${date}` : `UV-${initials}${count + 1}-${date}`;
}

function loadDetail(id: string) {
  const row = db.prepare("SELECT * FROM employees WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  const careerMapRole = row.career_map_role_id
    ? (db.prepare("SELECT * FROM career_map_roles WHERE id = ?").get(row.career_map_role_id as string) as
        | Record<string, unknown>
        | undefined)
    : undefined;
  const reportToEmployee = row.report_to_employee_id
    ? (db
        .prepare("SELECT id, employee_code, last_name, middle_name, first_name, english_name FROM employees WHERE id = ?")
        .get(row.report_to_employee_id as string) as Record<string, unknown> | undefined)
    : undefined;
  return {
    ...row,
    is_archived: Boolean(row.is_archived),
    is_offshore: Boolean(row.is_offshore),
    career_map_role: careerMapRole ? { ...careerMapRole, is_archived: Boolean(careerMapRole.is_archived) } : null,
    report_to_employee: reportToEmployee ?? null,
  };
}

employeesRouter.get("/", (req, res) => {
  const search = String(req.query.search ?? "").trim();
  const includeArchived = req.query.includeArchived === "true";
  const clauses: string[] = [];
  const params: string[] = [];
  if (!includeArchived) clauses.push("e.is_archived = 0");
  if (search) {
    clauses.push(
      "(e.last_name LIKE ? OR e.middle_name LIKE ? OR e.first_name LIKE ? OR e.english_name LIKE ? OR e.department LIKE ?)",
    );
    const like = `%${search}%`;
    params.push(like, like, like, like, like);
  }
  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  // Self-join to bring back the manager's name for the "Report To" column —
  // the list view shouldn't need a follow-up request per row just to show
  // who someone reports to.
  const rows = db
    .prepare(
      `SELECT e.id, e.employee_code, e.last_name, e.middle_name, e.first_name, e.english_name, e.department, e.rank,
              e.office_location, e.is_archived, e.is_offshore, m.id as report_to_id, m.employee_code as report_to_employee_code,
              m.last_name as report_to_last_name, m.middle_name as report_to_middle_name,
              m.first_name as report_to_first_name, m.english_name as report_to_english_name
       FROM employees e
       LEFT JOIN employees m ON e.report_to_employee_id = m.id
       ${where}
       ORDER BY e.last_name COLLATE NOCASE, e.first_name COLLATE NOCASE`,
    )
    .all(...params) as Record<string, unknown>[];
  res.json(
    rows.map((r) => ({
      id: r.id,
      employee_code: r.employee_code,
      last_name: r.last_name,
      middle_name: r.middle_name,
      first_name: r.first_name,
      english_name: r.english_name,
      department: r.department,
      rank: r.rank,
      office_location: r.office_location,
      is_archived: Boolean(r.is_archived),
      is_offshore: Boolean(r.is_offshore),
      report_to_employee: r.report_to_id
        ? {
            id: r.report_to_id,
            employee_code: r.report_to_employee_code,
            last_name: r.report_to_last_name,
            middle_name: r.report_to_middle_name,
            first_name: r.report_to_first_name,
            english_name: r.report_to_english_name,
          }
        : null,
    })),
  );
});

// Full-detail rows (not just the summary shape GET / uses for the table) —
// backs the "Export" button, which needs every field so the CSV round-trips
// through the update-import mode. Same search/includeArchived semantics as
// GET / so an export always matches what's currently on screen; must be
// registered before GET /:id or "/export" would be swallowed as an :id.
employeesRouter.get("/export", requireCap("employee.export"), (req, res) => {
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
  const ids = db
    .prepare(`SELECT id FROM employees ${where} ORDER BY last_name COLLATE NOCASE, first_name COLLATE NOCASE`)
    .all(...params) as { id: string }[];
  res.json(ids.map((r) => loadDetail(r.id)));
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
  const reportToId = resolveReportToId(input.report_to_employee_id);
  if (reportToId === "invalid") {
    res.status(400).json({ error: "That Report To employee no longer exists." });
    return;
  }
  const id = newId();
  const values = FIELDS.map((f) => input[f]?.toString().trim() || null);
  const employeeCode = generateEmployeeCode(input.first_name, input.last_name, input.commencement_date as string | null | undefined);
  db.prepare(
    `INSERT INTO employees (id, employee_code, ${FIELDS.join(", ")}, career_map_role_id, report_to_employee_id, is_offshore, created_by, updated_by) VALUES (?, ?, ${FIELDS.map(() => "?").join(", ")}, ?, ?, ?, ?, ?)`,
  ).run(id, employeeCode, ...values, careerMapRoleId, reportToId, input.is_offshore ? 1 : 0, req.user!.id, req.user!.id);
  logAudit("employee", id, "created", req.user!.id);
  res.status(201).json(loadDetail(id));
});

// Bulk create from a parsed CSV (client-side parsing — see
// EmployeeImportPage.tsx). Each row goes through the same validation as a
// single create; unlike POST /, is_archived is settable per row (an import
// is loading pre-existing HR history, not registering someone new — a
// manually-created employee is always "On Going" to start). Runs as one
// transaction: either every row commits, or none do, so a mid-import error
// never leaves a partial batch mixed in with existing data.
type ImportRow = EmployeeInput & { is_archived?: boolean };

employeesRouter.post("/import", requireCap("employee.create"), (req, res) => {
  const rows = (req.body?.rows ?? []) as ImportRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "rows must be a non-empty array." });
    return;
  }
  const errors: { row: number; message: string }[] = [];
  const createdIds: string[] = [];
  const importAll = transaction(() => {
    rows.forEach((row, i) => {
      const error = validate(row);
      if (error) {
        errors.push({ row: i, message: error });
        return;
      }
      const careerMapRoleId = resolveCareerMapRoleId(row.career_map_role_id);
      if (careerMapRoleId === "invalid") {
        errors.push({ row: i, message: "That Career Map role no longer exists." });
        return;
      }
      // Report To isn't part of the CSV mapping (see EmployeeImportPage.tsx)
      // — set manually per employee afterward, same as Department/Position
      // used to be before the Career Map link existed.
      const id = newId();
      const values = FIELDS.map((f) => row[f]?.toString().trim() || null);
      const employeeCode = generateEmployeeCode(row.first_name, row.last_name, row.commencement_date as string | null | undefined);
      db.prepare(
        `INSERT INTO employees (id, employee_code, ${FIELDS.join(", ")}, career_map_role_id, report_to_employee_id, is_offshore, is_archived, created_by, updated_by)
         VALUES (?, ?, ${FIELDS.map(() => "?").join(", ")}, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        employeeCode,
        ...values,
        careerMapRoleId,
        null,
        row.is_offshore ? 1 : 0,
        row.is_archived ? 1 : 0,
        req.user!.id,
        req.user!.id,
      );
      createdIds.push(id);
    });
    // Any row failing validation aborts the whole batch — an import is a
    // single all-or-nothing action from the user's point of view (they
    // already saw every row in the preview screen before confirming), not a
    // best-effort partial load that would need reconciling afterward.
    if (errors.length > 0) throw new Error("validation_failed");
  });
  try {
    importAll();
  } catch (err) {
    if (err instanceof Error && err.message === "validation_failed") {
      res.status(400).json({ error: "Some rows failed validation — nothing was imported.", errors });
      return;
    }
    throw err;
  }
  for (const id of createdIds) logAudit("employee", id, "created", req.user!.id);
  res.status(201).json({ created: createdIds.length });
});

// Bulk UPDATE from a parsed CSV — unlike POST /import, this never creates a
// new employee: each row is matched against an EXISTING employee by
// employee_code (Employee ID) or work_email, and only the fields actually
// present in that row are written — a blank cell leaves the existing value
// alone, so a CSV built to update just one thing (e.g. Contract
// Information for a batch of renewals) can't accidentally blank out
// everything else the way the full-record create/edit path would. A row
// with no match is skipped, not an error — "auto skip if not match" is the
// whole point of this mode, since a real HR export commonly has rows for
// people not yet in the system, or a stale email.
interface UpdateImportRow {
  employee_code?: string | null;
  work_email?: string | null;
  [key: string]: string | null | undefined;
}

function findEmployeeForUpdate(row: UpdateImportRow): Record<string, unknown> | undefined {
  if (row.employee_code) {
    const byCode = db.prepare("SELECT * FROM employees WHERE employee_code = ?").get(row.employee_code) as
      | Record<string, unknown>
      | undefined;
    if (byCode) return byCode;
  }
  if (row.work_email) {
    return db.prepare("SELECT * FROM employees WHERE work_email = ?").get(row.work_email) as
      | Record<string, unknown>
      | undefined;
  }
  return undefined;
}

employeesRouter.post("/import/update", requireCap("employee.edit"), (req, res) => {
  const rows = (req.body?.rows ?? []) as UpdateImportRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "rows must be a non-empty array." });
    return;
  }
  const results: { row: number; status: "updated" | "skipped"; reason?: string }[] = [];
  const updateAll = transaction(() => {
    rows.forEach((row, i) => {
      const existing = findEmployeeForUpdate(row);
      if (!existing) {
        results.push({ row: i, status: "skipped", reason: "No matching employee found" });
        return;
      }
      const fieldsToUpdate = FIELDS.filter((f) => row[f]?.toString().trim());
      if (fieldsToUpdate.length === 0) {
        results.push({ row: i, status: "skipped", reason: "No fields to update" });
        return;
      }
      const values = fieldsToUpdate.map((f) => row[f]!.toString().trim());
      db.prepare(
        `UPDATE employees SET ${fieldsToUpdate.map((f) => `${f} = ?`).join(", ")}, updated_by = ?, updated_at = datetime('now') WHERE id = ?`,
      ).run(...values, req.user!.id, existing.id as string);
      const before = {
        ...existing,
        is_archived: Boolean(existing.is_archived),
        is_offshore: Boolean(existing.is_offshore),
      };
      const after = loadDetail(existing.id as string)!;
      diffAndLog("employee", existing.id as string, before, after, fieldsToUpdate, req.user!.id);
      results.push({ row: i, status: "updated" });
    });
  });
  updateAll();
  res.json({
    updated: results.filter((r) => r.status === "updated").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    results,
  });
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
  const reportToId = resolveReportToId(input.report_to_employee_id, req.params.id);
  if (reportToId === "invalid") {
    res.status(400).json({ error: "That Report To employee no longer exists." });
    return;
  }
  if (reportToId === "self") {
    res.status(400).json({ error: "An employee can't report to themselves." });
    return;
  }
  const values = FIELDS.map((f) => input[f]?.toString().trim() || null);
  db.prepare(
    `UPDATE employees SET ${FIELDS.map((f) => `${f} = ?`).join(", ")}, career_map_role_id = ?, report_to_employee_id = ?, is_offshore = ?, updated_by = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(...values, careerMapRoleId, reportToId, input.is_offshore ? 1 : 0, req.user!.id, req.params.id);
  const updated = loadDetail(req.params.id)!;
  diffAndLog(
    "employee",
    req.params.id,
    existing,
    updated,
    [...FIELDS, "career_map_role_id", "report_to_employee_id", "is_offshore"],
    req.user!.id,
  );
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

// Danger Zone: a genuine hard delete, unlike everything else in this app —
// meant for wiping out botched test imports while the feature is still
// being set up, not a day-to-day operation. Requires the client to echo
// back a literal confirmation string (the UI's own type-to-confirm prompt
// enforces this same text) as a second guard against an accidental call.
// audit_log rows for past employee actions are deliberately left in place
// (no FK ties them to the now-gone rows) — the audit trail itself isn't
// what's being reset here.
employeesRouter.delete("/", requireCap("employee.archive"), (req, res) => {
  if (req.body?.confirm !== "DELETE ALL EMPLOYEE DATA") {
    res.status(400).json({ error: "Confirmation text didn't match — nothing was deleted." });
    return;
  }
  const result = db.prepare("DELETE FROM employees").run();
  logAudit("employee", "all", "deleted", req.user!.id, "bulk_delete", String(result.changes), "0");
  res.json({ deleted: result.changes });
});
