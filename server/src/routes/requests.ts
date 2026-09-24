import { Router } from "express";
import { db, transaction } from "../db.js";
import { newId } from "../ids.js";
import { requireAuth, requireCap } from "../middleware.js";
import { logAudit } from "../audit.js";
import { employeeScopeFor } from "./employees.js";
import { hasCapability } from "../capabilities.js";
import { resolvedChangedByName } from "../types.js";
import { computeAlEntitlementDays } from "../alEntitlement.js";
import type { PublicUser } from "../types.js";

export const requestsRouter = Router();
requestsRouter.use(requireAuth);

type RequestType = "AL" | "OT" | "BT";
type RequestStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "rejected"
  | "needs_changes"
  | "cancellation_requested"
  | "cancelled";

const REQUEST_TYPES: RequestType[] = ["AL", "OT", "BT"];
// Statuses a non-admin owner can hard-delete their own request from — see
// DELETE /:id and loadDetail's viewer.can_delete below. Anything in flight
// (pending_approval) or already effective (approved/cancellation_requested)
// has to go through Cancel/Request Cancellation instead, which preserves a
// record; admin/BOD bypass this list entirely.
const SELF_DELETABLE_STATUSES: RequestStatus[] = ["draft", "needs_changes", "rejected", "cancelled"];
const LEAVE_TYPES = ["Annual Leave", "Marriage Leave - Self", "Bereavement Leave - Family", "Other Unpaid Leave"];
const LEAVE_DURATIONS = ["Morning", "Afternoon", "Full Day"];
const OT_LOCATIONS = ["Office", "Site", "Remote", "Other"];

const EMPLOYEE_REF_COLUMNS = "id, employee_code, last_name, middle_name, first_name, english_name";

function myEmployeeRow(
  user: PublicUser,
): { id: string; report_to_employee_id: string | null; commencement_date: string | null } | undefined {
  return db
    .prepare("SELECT id, report_to_employee_id, commencement_date FROM employees WHERE LOWER(work_email) = ?")
    .get(user.email.toLowerCase()) as
    | { id: string; report_to_employee_id: string | null; commencement_date: string | null }
    | undefined;
}

function employeeRef(id: string | null): Record<string, unknown> | null {
  if (!id) return null;
  return (db.prepare(`SELECT ${EMPLOYEE_REF_COLUMNS} FROM employees WHERE id = ?`).get(id) as
    | Record<string, unknown>
    | undefined) ?? null;
}

// Admin/BOD are an oversight backstop on top of the normal "your own
// manager" approval chain — see routes/employees.ts's employeeScopeFor for
// the same two-tier reasoning applied to Employee Master.
function isAdminOversight(user: PublicUser): boolean {
  return user.access_level === "admin" || user.access_level === "owner";
}

// ---------- date/time helpers ----------

function parseISODate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

// Vietnam's fixed (solar-calendar) public holidays only — same date every
// year, no lookup table needed. Deliberately excludes Tết, Hùng Kings' Day,
// and National Day's government-chosen adjacent day, since those move or
// are set year by year rather than being genuinely fixed.
const VN_FIXED_HOLIDAYS = new Set([
  "01-01", // New Year's Day
  "04-30", // Reunification Day
  "05-01", // International Labor Day
  "09-02", // National Day
]);

function isVnFixedHoliday(d: Date): boolean {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return VN_FIXED_HOLIDAYS.has(`${mm}-${dd}`);
}

function isNonWorkingDay(d: Date): boolean {
  return isWeekend(d) || isVnFixedHoliday(d);
}

function parseHM(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

// Return to Work Date is the day the employee is BACK at work, not the
// last day of leave — so for a Full Day request it's an exclusive upper
// bound: a Friday start with a Monday return is 1 working day (Friday
// only), not 2. A half-day request follows the same "day you're back"
// idea, just scaled down: Morning off means you're back at work that same
// afternoon, so Return to Work Date equals Start Date; Afternoon off means
// you don't return until the following day, so Return to Work Date is
// exactly one calendar day after Start Date (see validateHalfDayDates,
// which enforces this exact relationship before this function ever runs).
// Either way it's always the Start Date's afternoon/morning being taken
// off, so that's the date checked against weekends/holidays — the Return
// Date itself is never a working day either way, it's just where the
// "day you're back" marker lands. `countWeekends` defaults to false (the
// normal "weekends and Vietnam's fixed public holidays aren't working
// days" rule for a live submission) — the historical import is the one
// caller that can override it per-row, for a company that sometimes
// treats a Saturday (or a holiday) as a working day.
function calcAlDays(startDate: string, returnDate: string, duration: string, countWeekends = false): number {
  const start = parseISODate(startDate);
  const end = parseISODate(returnDate);
  if (end < start) return 0;
  if (duration !== "Full Day") {
    const expectedSpan = duration === "Afternoon" ? 1 : 0;
    return daysBetween(start, end) === expectedSpan && (countWeekends || !isNonWorkingDay(start)) ? 0.5 : 0;
  }
  let count = 0;
  const cur = new Date(start);
  while (cur < end) {
    if (countWeekends || !isNonWorkingDay(cur)) count++;
    cur.setDate(cur.getDate() + 1);
  }
  return count;
}

// Validates the Start/Return date relationship a given duration requires —
// see calcAlDays' comment above for why Morning and Afternoon differ.
// Shared between the live submit path (validateForSubmit) and the
// historical CSV import's row validation, so the rule can't drift between
// the two entry points.
function validateHalfDayDates(startDate: string, returnDate: string, duration: string): string | null {
  if (duration === "Morning" && startDate !== returnDate) {
    return "A Morning request must have the same Start Date and Return to Work Date.";
  }
  if (duration === "Afternoon" && daysBetween(parseISODate(startDate), parseISODate(returnDate)) !== 1) {
    return "An Afternoon request's Return to Work Date must be the day after the Start Date.";
  }
  return null;
}

// end <= start is always treated as crossing midnight (there's no separate
// "crosses midnight" flag in the form) — matches the spec's "unless OT
// crosses midnight" exception as the same rule, not an extra check.
function calcOtHours(startTime: string, endTime: string, breakMinutes: number): number {
  const startMin = parseHM(startTime);
  let endMin = parseHM(endTime);
  if (endMin <= startMin) endMin += 24 * 60;
  const totalMin = Math.max(0, endMin - startMin - breakMinutes);
  return Math.round((totalMin / 60) * 100) / 100;
}

function otRangeOverlaps(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  const s1 = parseHM(aStart);
  let e1 = parseHM(aEnd);
  if (e1 <= s1) e1 += 24 * 60;
  const s2 = parseHM(bStart);
  let e2 = parseHM(bEnd);
  if (e2 <= s2) e2 += 24 * 60;
  return s1 < e2 && s2 < e1;
}

// Inclusive calendar-day span, ignoring time-of-day — a same-day round trip
// still counts as 1 day.
function calcBtDays(departureAt: string, returnAt: string): number {
  const dep = new Date(departureAt);
  const ret = new Date(returnAt);
  const depDate = new Date(dep.getFullYear(), dep.getMonth(), dep.getDate());
  const retDate = new Date(ret.getFullYear(), ret.getMonth(), ret.getDate());
  const diffDays = Math.round((retDate.getTime() - depDate.getTime()) / 86400000);
  return Math.max(1, diffDays + 1);
}

// "AL-2026-0001" — only generated on submit (see POST /:id/submit) so a
// draft that's never submitted never consumes a sequence number. Mirrors
// generateEmployeeCode's counting approach in routes/employees.ts.
function generateRequestCode(type: RequestType): string {
  const year = new Date().getFullYear();
  const prefix = `${type}-${year}-`;
  const count = (
    db.prepare("SELECT COUNT(*) as n FROM requests WHERE request_code LIKE ?").get(`${prefix}%`) as { n: number }
  ).n;
  return `${prefix}${String(count + 1).padStart(4, "0")}`;
}

// Sum of days already committed against this employee's entitlement for the
// given year — only *approved* requests, and only the "Annual Leave" leave
// type (Marriage/Bereavement/Unpaid don't draw from the entitlement).
// Counts 'approved' AND 'cancellation_requested' — a cancellation only
// actually frees the balance once the approver confirms it (status becomes
// 'cancelled'); merely *requesting* cancellation must not let the same days
// be booked again before that confirmation happens.
function alDaysUsed(employeeId: string, year: number, excludeRequestId?: string): number {
  const rows = db
    .prepare(
      `SELECT r.id, d.days_requested FROM requests r
       JOIN al_details d ON d.request_id = r.id
       WHERE r.employee_id = ? AND r.status IN ('approved', 'cancellation_requested') AND d.leave_type = 'Annual Leave'
         AND substr(d.start_date, 1, 4) = ?`,
    )
    .all(employeeId, String(year)) as { id: string; days_requested: number }[];
  return rows.filter((r) => r.id !== excludeRequestId).reduce((sum, r) => sum + r.days_requested, 0);
}

function hasOtOverlap(employeeId: string, otDate: string, startTime: string, endTime: string, excludeRequestId?: string): boolean {
  const rows = db
    .prepare(
      `SELECT r.id, d.start_time, d.end_time FROM requests r
       JOIN ot_details d ON d.request_id = r.id
       WHERE r.employee_id = ? AND d.ot_date = ? AND r.status NOT IN ('rejected', 'cancelled')`,
    )
    .all(employeeId, otDate) as { id: string; start_time: string; end_time: string }[];
  return rows.some((r) => r.id !== excludeRequestId && otRangeOverlaps(startTime, endTime, r.start_time, r.end_time));
}

// ---------- loading ----------

// `viewerEmployeeId`/`viewerIsAdmin` describe whoever is asking, so the
// response can carry ready-to-use flags (can_edit, can_decide, ...) instead
// of the client needing to know its own employee id just to figure out
// which buttons to show — the client is never told employee-id-to-user
// mappings beyond what's already in `employee`/`approver`.
function loadDetail(
  id: string,
  viewerEmployeeId?: string,
  viewerIsAdmin?: boolean,
): Record<string, unknown> | undefined {
  const row = db.prepare("SELECT * FROM requests WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  if (!row) return undefined;
  const type = row.type as RequestType;
  const detailTable = type === "AL" ? "al_details" : type === "OT" ? "ot_details" : "bt_details";
  const detail = db.prepare(`SELECT * FROM ${detailTable} WHERE request_id = ?`).get(id) as
    | Record<string, unknown>
    | undefined;
  const history = (
    db
      .prepare(
        `SELECT audit_log.id, audit_log.action, audit_log.field_name, audit_log.old_value, audit_log.new_value,
                audit_log.changed_at, users.name as changed_by_name, users.email as changed_by_email
         FROM audit_log LEFT JOIN users ON users.id = audit_log.changed_by
         WHERE audit_log.entity_type = 'request' AND audit_log.entity_id = ?
         ORDER BY audit_log.changed_at ASC`,
      )
      .all(id) as {
      id: string;
      action: string;
      field_name: string | null;
      old_value: string | null;
      new_value: string | null;
      changed_at: string;
      changed_by_name: string | null;
      changed_by_email: string | null;
    }[]
  ).map(resolvedChangedByName);
  const isOwner = viewerEmployeeId != null && row.employee_id === viewerEmployeeId;
  const isApprover = viewerEmployeeId != null && row.approver_id === viewerEmployeeId;
  const status = row.status as RequestStatus;
  return {
    ...row,
    employee: employeeRef(row.employee_id as string),
    approver: employeeRef(row.approver_id as string | null),
    detail: detail ?? null,
    history,
    viewer: {
      can_edit: isOwner && (status === "draft" || status === "needs_changes"),
      can_submit: isOwner && (status === "draft" || status === "needs_changes"),
      can_cancel: isOwner && status !== "cancelled" && status !== "rejected" && status !== "cancellation_requested",
      can_delete: Boolean(viewerIsAdmin) || (isOwner && SELF_DELETABLE_STATUSES.includes(status)),
      can_decide: (isApprover || viewerIsAdmin) && status === "pending_approval",
      can_decide_cancellation: (isApprover || viewerIsAdmin) && status === "cancellation_requested",
    },
  };
}

// Anyone holding request.manageAll (Head of Department and up — see
// capabilities.ts) can view any request from an employee in their
// employeeScopeFor scope, same reasoning as isAdminOversight above but
// scoped instead of unconditional. This is read access only — loadDetail's
// `viewer` flags are still computed from actual employee_id/approver_id
// match, so a Head of Department viewing a report's request they didn't
// personally approve sees it with no decide/cancel buttons, same as before.
function canView(req: Record<string, unknown>, employeeId: string | undefined, user: PublicUser): boolean {
  if (isAdminOversight(user)) return true;
  if (hasCapability(user.access_level, "request.manageAll")) {
    const scope = employeeScopeFor(user);
    if (scope.ids === null || scope.ids.has(req.employee_id as string)) return true;
  }
  if (!employeeId) return false;
  return req.employee_id === employeeId || req.approver_id === employeeId;
}

// ---------- validation ----------

interface RequestBody {
  type?: RequestType;
  // AL
  leave_type?: string;
  reason?: string;
  start_date?: string;
  return_to_work_date?: string;
  duration?: string;
  // Historical-import-only override — see calcAlDays. Never set by the
  // live AL form, so it's always falsy (the normal rule) outside of
  // POST /requests/import.
  count_weekends?: boolean;
  // OT
  ot_date?: string;
  start_time?: string;
  end_time?: string;
  break_minutes?: number;
  project_department?: string;
  location?: string;
  // BT
  destination?: string;
  purpose?: string;
  departure_at?: string;
  return_at?: string;
  project_client?: string;
  transportation_required?: boolean;
  hotel_required?: boolean;
  advance_payment_required?: boolean;
  advance_amount?: number;
  advance_currency?: string;
  advance_notes?: string;
  additional_notes?: string;
}

// Draft-time: just enough structure to store a coherent row. Full
// requiredness is only enforced on submit (validateForSubmit below) — a
// draft is allowed to be incomplete.
function validateShape(type: RequestType, body: RequestBody): string | null {
  if (type === "AL") {
    if (!body.leave_type || !LEAVE_TYPES.includes(body.leave_type)) return "Leave Type is required.";
    if (!body.start_date) return "Start Date is required.";
    if (!body.return_to_work_date) return "Return to Work Date is required.";
    if (!body.duration || !LEAVE_DURATIONS.includes(body.duration)) return "Leave Duration is required.";
  } else if (type === "OT") {
    if (!body.ot_date) return "OT Date is required.";
    if (!body.start_time) return "Start Time is required.";
    if (!body.end_time) return "End Time is required.";
    if (body.location && !OT_LOCATIONS.includes(body.location)) return "Invalid Location.";
  } else {
    if (!body.destination) return "Destination is required.";
    if (!body.departure_at) return "Departure Date & Time is required.";
    if (!body.return_at) return "Return Date & Time is required.";
  }
  return null;
}

function validateForSubmit(type: RequestType, body: RequestBody): string | null {
  const shapeError = validateShape(type, body);
  if (shapeError) return shapeError;
  if (type === "AL") {
    if (body.duration !== "Full Day") {
      const halfDayError = validateHalfDayDates(body.start_date!, body.return_to_work_date!, body.duration!);
      if (halfDayError) return halfDayError;
    }
    // Return to Work Date is the day you're back at work, so for a Full
    // Day request it must be strictly after Start Date — even a single
    // day off needs the next working day as the return date, not the
    // same day (see calcAlDays).
    if (body.duration === "Full Day" && body.return_to_work_date! <= body.start_date!) {
      return "Return to Work Date must be after Start Date — it's the day you're back at work, not the last day of leave.";
    }
    if (calcAlDays(body.start_date!, body.return_to_work_date!, body.duration!) <= 0) {
      return "This request doesn't cover any working days — check the dates.";
    }
  } else if (type === "OT") {
    if (!body.reason?.trim()) return "Reason / Work Description is required.";
    if (!body.location) return "Location is required.";
  } else {
    if (!body.purpose?.trim()) return "Purpose of Trip is required.";
    if (new Date(body.return_at!) <= new Date(body.departure_at!)) {
      return "Return Date & Time must be after Departure Date & Time.";
    }
    if (body.advance_payment_required && (body.advance_amount == null || !body.advance_currency)) {
      return "Requested Amount and Currency are required when Advance Payment is needed.";
    }
  }
  return null;
}

// ---------- draft create/edit ----------

function upsertDetail(requestId: string, type: RequestType, body: RequestBody) {
  if (type === "AL") {
    db.prepare(
      `INSERT INTO al_details (request_id, leave_type, reason, start_date, return_to_work_date, duration, days_requested)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(request_id) DO UPDATE SET leave_type=excluded.leave_type, reason=excluded.reason,
         start_date=excluded.start_date, return_to_work_date=excluded.return_to_work_date,
         duration=excluded.duration, days_requested=excluded.days_requested`,
    ).run(
      requestId,
      body.leave_type ?? "",
      body.reason ?? null,
      body.start_date ?? "",
      body.return_to_work_date ?? "",
      body.duration ?? "",
      body.start_date && body.return_to_work_date && body.duration
        ? calcAlDays(body.start_date, body.return_to_work_date, body.duration, body.count_weekends)
        : 0,
    );
  } else if (type === "OT") {
    const breakMinutes = body.break_minutes ?? 0;
    db.prepare(
      `INSERT INTO ot_details (request_id, ot_date, start_time, end_time, break_minutes, total_hours, reason, project_department, location)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(request_id) DO UPDATE SET ot_date=excluded.ot_date, start_time=excluded.start_time,
         end_time=excluded.end_time, break_minutes=excluded.break_minutes, total_hours=excluded.total_hours,
         reason=excluded.reason, project_department=excluded.project_department, location=excluded.location`,
    ).run(
      requestId,
      body.ot_date ?? "",
      body.start_time ?? "",
      body.end_time ?? "",
      breakMinutes,
      body.start_time && body.end_time ? calcOtHours(body.start_time, body.end_time, breakMinutes) : 0,
      body.reason ?? "",
      body.project_department ?? null,
      body.location ?? "Office",
    );
  } else {
    db.prepare(
      `INSERT INTO bt_details (request_id, destination, purpose, departure_at, return_at, days_requested,
         project_client, transportation_required, hotel_required, advance_payment_required, advance_amount,
         advance_currency, advance_notes, additional_notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(request_id) DO UPDATE SET destination=excluded.destination, purpose=excluded.purpose,
         departure_at=excluded.departure_at, return_at=excluded.return_at, days_requested=excluded.days_requested,
         project_client=excluded.project_client, transportation_required=excluded.transportation_required,
         hotel_required=excluded.hotel_required, advance_payment_required=excluded.advance_payment_required,
         advance_amount=excluded.advance_amount, advance_currency=excluded.advance_currency,
         advance_notes=excluded.advance_notes, additional_notes=excluded.additional_notes`,
    ).run(
      requestId,
      body.destination ?? "",
      body.purpose ?? "",
      body.departure_at ?? "",
      body.return_at ?? "",
      body.departure_at && body.return_at ? calcBtDays(body.departure_at, body.return_at) : 0,
      body.project_client ?? null,
      body.transportation_required ? 1 : 0,
      body.hotel_required ? 1 : 0,
      body.advance_payment_required ? 1 : 0,
      body.advance_amount ?? null,
      body.advance_currency ?? null,
      body.advance_notes ?? null,
      body.additional_notes ?? null,
    );
  }
}

// ---------- historical import ----------

function isValidIsoDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = parseISODate(s);
  return (
    d.getFullYear() === Number(s.slice(0, 4)) &&
    d.getMonth() === Number(s.slice(5, 7)) - 1 &&
    d.getDate() === Number(s.slice(8, 10))
  );
}

function isValidTime(s: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(s)) return false;
  const [h, m] = s.split(":").map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
}

function parseImportBool(s: string | undefined): boolean {
  return ["yes", "true", "1"].includes((s ?? "").trim().toLowerCase());
}

interface ImportRowResult {
  row: number; // 1-based, matching the spreadsheet's row number for error messages
  error?: string;
  employeeId?: string;
  reportToEmployeeId?: string | null;
  body?: RequestBody;
}

// Mirrors validateForSubmit's rules for each type, but works off raw
// spreadsheet strings instead of the live form's already-typed RequestBody,
// and deliberately skips the AL balance check — historical data is being
// loaded as fact, not re-validated against today's entitlement.
function validateImportRow(type: RequestType, raw: Record<string, string>, rowNumber: number): ImportRowResult {
  const email = (raw["Work Email"] ?? "").trim().toLowerCase();
  if (!email) return { row: rowNumber, error: "Work Email is required." };
  const employee = db
    .prepare("SELECT id, report_to_employee_id FROM employees WHERE LOWER(work_email) = ?")
    .get(email) as { id: string; report_to_employee_id: string | null } | undefined;
  if (!employee) return { row: rowNumber, error: `No employee found with Work Email "${email}".` };

  if (type === "AL") {
    const leaveType = (raw["Leave Type"] ?? "").trim();
    const startDate = (raw["Start Date"] ?? "").trim();
    const returnDate = (raw["Return to Work Date"] ?? "").trim();
    const duration = (raw["Duration"] ?? "").trim();
    if (!LEAVE_TYPES.includes(leaveType)) {
      return { row: rowNumber, error: `Leave Type must be one of: ${LEAVE_TYPES.join(", ")}.` };
    }
    if (!isValidIsoDate(startDate)) return { row: rowNumber, error: "Start Date must be a valid date (YYYY-MM-DD)." };
    if (!isValidIsoDate(returnDate)) {
      return { row: rowNumber, error: "Return to Work Date must be a valid date (YYYY-MM-DD)." };
    }
    if (!LEAVE_DURATIONS.includes(duration)) {
      return { row: rowNumber, error: `Duration must be one of: ${LEAVE_DURATIONS.join(", ")}.` };
    }
    if (duration !== "Full Day") {
      const halfDayError = validateHalfDayDates(startDate, returnDate, duration);
      if (halfDayError) return { row: rowNumber, error: halfDayError };
    }
    // Same "Return to Work Date is exclusive" rule as a live submission
    // (see calcAlDays) — a Full Day row needs the next working day as its
    // return date, even for a single day of historical leave.
    if (duration === "Full Day" && returnDate <= startDate) {
      return {
        row: rowNumber,
        error: "Return to Work Date must be after Start Date — it's the day the employee was back at work.",
      };
    }
    // Optional override for a company that sometimes works Saturdays — a
    // row marked Yes counts every day in its range as a working day
    // instead of skipping Sat/Sun, since historical data isn't always on
    // a strict Mon-Fri schedule.
    const countWeekends = parseImportBool(raw["Treat Weekend as Working Day"]);
    if (calcAlDays(startDate, returnDate, duration, countWeekends) <= 0) {
      return { row: rowNumber, error: "This request doesn't cover any working days — check the dates." };
    }
    const body: RequestBody = {
      type: "AL",
      leave_type: leaveType,
      reason: (raw["Reason"] ?? "").trim() || undefined,
      start_date: startDate,
      return_to_work_date: returnDate,
      duration,
      count_weekends: countWeekends,
    };
    return { row: rowNumber, employeeId: employee.id, reportToEmployeeId: employee.report_to_employee_id, body };
  }

  if (type === "OT") {
    const otDate = (raw["OT Date"] ?? "").trim();
    const startTime = (raw["Start Time"] ?? "").trim();
    const endTime = (raw["End Time"] ?? "").trim();
    const breakMinutesRaw = (raw["Break Minutes"] ?? "").trim();
    const location = (raw["Location"] ?? "").trim() || "Office";
    if (!isValidIsoDate(otDate)) return { row: rowNumber, error: "OT Date must be a valid date (YYYY-MM-DD)." };
    if (!isValidTime(startTime)) return { row: rowNumber, error: "Start Time must be in HH:MM (24-hour) format." };
    if (!isValidTime(endTime)) return { row: rowNumber, error: "End Time must be in HH:MM (24-hour) format." };
    const breakMinutes = breakMinutesRaw ? Number(breakMinutesRaw) : 0;
    if (!Number.isFinite(breakMinutes) || breakMinutes < 0) {
      return { row: rowNumber, error: "Break Minutes must be a non-negative number." };
    }
    if (!OT_LOCATIONS.includes(location)) {
      return { row: rowNumber, error: `Location must be one of: ${OT_LOCATIONS.join(", ")}.` };
    }
    if (calcOtHours(startTime, endTime, breakMinutes) <= 0) {
      return { row: rowNumber, error: "This request doesn't add up to any overtime hours — check the times and break." };
    }
    const body: RequestBody = {
      type: "OT",
      ot_date: otDate,
      start_time: startTime,
      end_time: endTime,
      break_minutes: breakMinutes,
      reason: (raw["Reason"] ?? "").trim() || "Historical import",
      project_department: (raw["Project/Department"] ?? "").trim() || undefined,
      location,
    };
    return { row: rowNumber, employeeId: employee.id, reportToEmployeeId: employee.report_to_employee_id, body };
  }

  // BT
  const destination = (raw["Destination"] ?? "").trim();
  const purpose = (raw["Purpose"] ?? "").trim();
  const departureDate = (raw["Departure Date"] ?? "").trim();
  const returnDateRaw = (raw["Return Date"] ?? "").trim();
  if (!destination) return { row: rowNumber, error: "Destination is required." };
  if (!purpose) return { row: rowNumber, error: "Purpose is required." };
  if (!isValidIsoDate(departureDate)) {
    return { row: rowNumber, error: "Departure Date must be a valid date (YYYY-MM-DD)." };
  }
  if (!isValidIsoDate(returnDateRaw)) return { row: rowNumber, error: "Return Date must be a valid date (YYYY-MM-DD)." };
  // Departure/Return Time are optional — historical data doesn't always
  // record exact times, so a blank one falls back to a fixed 09:00/18:00,
  // just enough time-of-day to keep departure_at/return_at's stored shape
  // consistent with a live BT submission (calcBtDays only reads the date
  // part of each anyway, regardless of which time ends up here).
  const departureTimeRaw = (raw["Departure Time"] ?? "").trim();
  const returnTimeRaw = (raw["Return Time"] ?? "").trim();
  if (departureTimeRaw && !isValidTime(departureTimeRaw)) {
    return { row: rowNumber, error: "Departure Time must be in HH:MM (24-hour) format." };
  }
  if (returnTimeRaw && !isValidTime(returnTimeRaw)) {
    return { row: rowNumber, error: "Return Time must be in HH:MM (24-hour) format." };
  }
  const departureAt = `${departureDate}T${departureTimeRaw || "09:00"}`;
  const returnAt = `${returnDateRaw}T${returnTimeRaw || "18:00"}`;
  if (new Date(returnAt) <= new Date(departureAt)) {
    return { row: rowNumber, error: "Return Date/Time must be after Departure Date/Time." };
  }
  const advancePaymentRequired = parseImportBool(raw["Advance Payment Required"]);
  const advanceAmountRaw = (raw["Advance Amount"] ?? "").trim();
  const advanceCurrency = (raw["Advance Currency"] ?? "").trim() || undefined;
  const advanceAmount = advanceAmountRaw ? Number(advanceAmountRaw) : undefined;
  if (advancePaymentRequired && (advanceAmount == null || !Number.isFinite(advanceAmount) || !advanceCurrency)) {
    return {
      row: rowNumber,
      error: "Advance Amount and Advance Currency are required when Advance Payment Required is Yes.",
    };
  }
  const body: RequestBody = {
    type: "BT",
    destination,
    purpose,
    departure_at: departureAt,
    return_at: returnAt,
    project_client: (raw["Project/Client"] ?? "").trim() || undefined,
    transportation_required: parseImportBool(raw["Transportation Required"]),
    hotel_required: parseImportBool(raw["Hotel Required"]),
    advance_payment_required: advancePaymentRequired,
    advance_amount: advanceAmount,
    advance_currency: advanceCurrency,
    advance_notes: (raw["Advance Notes"] ?? "").trim() || undefined,
    additional_notes: (raw["Additional Notes"] ?? "").trim() || undefined,
  };
  return { row: rowNumber, employeeId: employee.id, reportToEmployeeId: employee.report_to_employee_id, body };
}

// All-or-nothing, same as the Employee Master CSV import: every row is
// validated up front, and if any row fails nothing is written at all,
// rather than leaving a partially-imported batch to sort out by hand.
// Imported requests land straight in 'approved' status — see the plan's
// ADR — with no approver assigned (the employee's own manager, if any, is
// recorded anyway, but nobody actually decided this one; it's a fact being
// loaded, not a request moving through the workflow).
requestsRouter.post("/import", requireCap("request.import"), (req, res) => {
  const { type, rows } = req.body as { type?: RequestType; rows?: Record<string, string>[] };
  if (!type || !REQUEST_TYPES.includes(type)) {
    res.status(400).json({ error: "type must be one of AL, OT, BT." });
    return;
  }
  if (!Array.isArray(rows) || rows.length === 0) {
    res.status(400).json({ error: "No rows to import." });
    return;
  }
  const results = rows.map((raw, i) => validateImportRow(type, raw, i + 1));
  const rowErrors = results.filter((r) => r.error).map((r) => ({ row: r.row, error: r.error! }));
  if (rowErrors.length > 0) {
    res.status(400).json({ error: "Some rows couldn't be imported — nothing was saved.", rowErrors });
    return;
  }
  const importedIds: string[] = [];
  const commit = transaction(() => {
    for (const r of results) {
      const id = newId();
      const code = generateRequestCode(type);
      db.prepare(
        `INSERT INTO requests (id, request_code, type, employee_id, approver_id, status, submitted_at, decided_by, decided_at, created_by)
         VALUES (?, ?, ?, ?, ?, 'approved', datetime('now'), ?, datetime('now'), ?)`,
      ).run(id, code, type, r.employeeId!, r.reportToEmployeeId ?? null, req.user!.id, req.user!.id);
      upsertDetail(id, type, r.body!);
      logAudit("request", id, "imported", req.user!.id);
      importedIds.push(id);
    }
  });
  commit();
  res.status(201).json({ imported: importedIds.length });
});

requestsRouter.post("/", (req, res) => {
  const me = myEmployeeRow(req.user!);
  if (!me) {
    res.status(400).json({ error: "No employee record is linked to your account yet." });
    return;
  }
  const body = req.body as RequestBody;
  const type = body.type;
  if (!type || !REQUEST_TYPES.includes(type)) {
    res.status(400).json({ error: "type must be one of AL, OT, BT." });
    return;
  }
  const error = validateShape(type, body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  const id = newId();
  const create = transaction(() => {
    db.prepare(
      "INSERT INTO requests (id, type, employee_id, status, created_by) VALUES (?, ?, ?, 'draft', ?)",
    ).run(id, type, me.id, req.user!.id);
    upsertDetail(id, type, body);
  });
  create();
  logAudit("request", id, "created", req.user!.id);
  res.status(201).json(loadDetail(id, me.id, isAdminOversight(req.user!)));
});

requestsRouter.patch("/:id", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const existing = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as
    | { employee_id: string; status: RequestStatus; type: RequestType }
    | undefined;
  if (!existing || !me || existing.employee_id !== me.id) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (existing.status !== "draft" && existing.status !== "needs_changes") {
    res.status(400).json({ error: "Only a Draft or Needs Changes request can be edited." });
    return;
  }
  const body = req.body as RequestBody;
  const error = validateShape(existing.type, body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  upsertDetail(req.params.id, existing.type, body);
  res.json(loadDetail(req.params.id, me.id, isAdminOversight(req.user!)));
});

requestsRouter.post("/:id/submit", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const existing = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as
    | { id: string; employee_id: string; status: RequestStatus; type: RequestType; request_code: string | null }
    | undefined;
  if (!existing || !me || existing.employee_id !== me.id) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (existing.status !== "draft" && existing.status !== "needs_changes") {
    res.status(400).json({ error: "Only a Draft or Needs Changes request can be submitted." });
    return;
  }
  const detailTable = existing.type === "AL" ? "al_details" : existing.type === "OT" ? "ot_details" : "bt_details";
  const detail = db.prepare(`SELECT * FROM ${detailTable} WHERE request_id = ?`).get(existing.id) as
    | RequestBody
    | undefined;
  const body: RequestBody = { ...detail, type: existing.type };
  const error = validateForSubmit(existing.type, body);
  if (error) {
    res.status(400).json({ error });
    return;
  }
  if (existing.type === "AL" && body.leave_type === "Annual Leave") {
    const year = Number(body.start_date!.slice(0, 4));
    const used = alDaysUsed(me.id, year, existing.id);
    const requested = calcAlDays(body.start_date!, body.return_to_work_date!, body.duration!);
    const entitlement = computeAlEntitlementDays(me.commencement_date);
    if (used + requested > entitlement) {
      res.status(400).json({
        error: `Not enough Annual Leave balance — ${entitlement - used} day(s) remaining for ${year}, ${requested} requested.`,
      });
      return;
    }
  }
  if (existing.type === "OT" && hasOtOverlap(me.id, body.ot_date!, body.start_time!, body.end_time!, existing.id)) {
    res.status(400).json({ error: "You already have an Overtime request for an overlapping period on this date." });
    return;
  }
  if (!me.report_to_employee_id) {
    res.status(400).json({ error: "You don't have a manager set in Employee Master — contact HR before submitting." });
    return;
  }
  // Resubmitting after Return for Edit keeps the code it already has — a
  // request's reference number is assigned once, on its first-ever submit,
  // not reissued every time it goes needs_changes -> pending_approval again.
  const code = existing.request_code ?? generateRequestCode(existing.type);
  db.prepare(
    `UPDATE requests SET status = 'pending_approval', request_code = ?, approver_id = ?, submitted_at = datetime('now'),
       updated_at = datetime('now') WHERE id = ?`,
  ).run(code, me.report_to_employee_id, existing.id);
  logAudit("request", existing.id, "submitted", req.user!.id);
  res.json(loadDetail(existing.id, me.id, isAdminOversight(req.user!)));
});

requestsRouter.get("/", (req, res) => {
  const me = myEmployeeRow(req.user!);
  if (!me) {
    res.json([]);
    return;
  }
  const { type, status, from, to } = req.query as Record<string, string | undefined>;
  const clauses = ["employee_id = ?"];
  const params: string[] = [me.id];
  if (type && REQUEST_TYPES.includes(type as RequestType)) {
    clauses.push("type = ?");
    params.push(type);
  }
  if (status) {
    clauses.push("status = ?");
    params.push(status);
  }
  const rows = db
    .prepare(`SELECT id FROM requests WHERE ${clauses.join(" AND ")} ORDER BY created_at DESC`)
    .all(...params) as { id: string }[];
  const admin = isAdminOversight(req.user!);
  let details = rows.map((r) => loadDetail(r.id, me.id, admin)!);
  if (from) details = details.filter((d) => requestDate(d) >= from);
  if (to) details = details.filter((d) => requestDate(d) <= to);
  res.json(details);
});

// The one date that best represents "when" a request is for, used for the
// My Requests date filter and column — different field per type since they
// don't share a common date column.
function requestDate(d: Record<string, unknown>): string {
  const detail = d.detail as Record<string, unknown> | null;
  if (!detail) return "";
  if (d.type === "AL") return (detail.start_date as string) ?? "";
  if (d.type === "OT") return (detail.ot_date as string) ?? "";
  return ((detail.departure_at as string) ?? "").slice(0, 10);
}

// Self-service "how many Annual Leave days do I have left" — lets the
// Submit form show this before the employee commits to submitting (see
// ALRequestForm), using the exact same entitlement/used math as the
// server-side balance check in POST /:id/submit, so the two can never
// disagree about whether a request will fit.
requestsRouter.get("/al-balance", (req, res) => {
  const me = myEmployeeRow(req.user!);
  if (!me) {
    res.status(400).json({ error: "No employee record is linked to your account yet." });
    return;
  }
  const year = req.query.year != null && req.query.year !== "" ? Number(req.query.year) : new Date().getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    res.status(400).json({ error: "year must be a 4-digit year." });
    return;
  }
  const entitlement = computeAlEntitlementDays(me.commencement_date);
  const used = alDaysUsed(me.id, year);
  res.json({ year, entitlement, used, remaining: entitlement - used });
});

// Company-wide (well, "everyone this viewer is allowed to see") view of
// approved absences for one calendar month — powers the Employee
// Dashboard's Leave/BT calendars and OT summary. Scoped exactly like
// Employee Master (see employeeScopeFor): Owner/Admin see everyone, a Team
// Lead/Head of Department sees their own reporting chain + themselves, and
// anyone else effectively only sees themselves. `cancellation_requested` is
// included alongside `approved` — same reasoning as alDaysUsed above: it's
// still an active leave/BT/OT until the cancellation is actually confirmed.
const DASHBOARD_STATUSES = "('approved', 'cancellation_requested')";

requestsRouter.get("/dashboard", (req, res) => {
  const month = String(req.query.month ?? "");
  if (!/^\d{4}-\d{2}$/.test(month)) {
    res.status(400).json({ error: "month must be in YYYY-MM format." });
    return;
  }
  const monthStart = `${month}-01`;
  const [y, m] = month.split("-").map(Number);
  const monthEnd = new Date(y, m, 0).toISOString().slice(0, 10); // last day of month

  const scope = employeeScopeFor(req.user!);
  const inScope = (employeeId: string) => scope.ids === null || scope.ids.has(employeeId);

  const leave = (
    db
      .prepare(
        `SELECT r.employee_id, d.leave_type, d.start_date, d.return_to_work_date
         FROM requests r JOIN al_details d ON d.request_id = r.id
         WHERE r.status IN ${DASHBOARD_STATUSES} AND d.start_date <= ? AND d.return_to_work_date >= ?`,
      )
      .all(monthEnd, monthStart) as {
      employee_id: string;
      leave_type: string;
      start_date: string;
      return_to_work_date: string;
    }[]
  )
    .filter((r) => inScope(r.employee_id))
    .map((r) => ({
      employee_id: r.employee_id,
      employee: employeeRef(r.employee_id),
      leave_type: r.leave_type,
      start_date: r.start_date,
      end_date: r.return_to_work_date,
    }));

  const bt = (
    db
      .prepare(
        `SELECT r.employee_id, d.destination, d.departure_at, d.return_at
         FROM requests r JOIN bt_details d ON d.request_id = r.id
         WHERE r.status IN ${DASHBOARD_STATUSES} AND substr(d.departure_at, 1, 10) <= ? AND substr(d.return_at, 1, 10) >= ?`,
      )
      .all(monthEnd, monthStart) as {
      employee_id: string;
      destination: string;
      departure_at: string;
      return_at: string;
    }[]
  )
    .filter((r) => inScope(r.employee_id))
    .map((r) => ({
      employee_id: r.employee_id,
      employee: employeeRef(r.employee_id),
      destination: r.destination,
      start_date: r.departure_at.slice(0, 10),
      end_date: r.return_at.slice(0, 10),
    }));

  const otRows = (
    db
      .prepare(
        `SELECT r.employee_id, d.total_hours
         FROM requests r JOIN ot_details d ON d.request_id = r.id
         WHERE r.status IN ${DASHBOARD_STATUSES} AND d.ot_date >= ? AND d.ot_date <= ?`,
      )
      .all(monthStart, monthEnd) as { employee_id: string; total_hours: number }[]
  ).filter((r) => inScope(r.employee_id));
  const otTotals = new Map<string, number>();
  for (const r of otRows) otTotals.set(r.employee_id, (otTotals.get(r.employee_id) ?? 0) + r.total_hours);
  const ot = [...otTotals.entries()]
    .map(([employee_id, total_hours]) => ({ employee_id, employee: employeeRef(employee_id), total_hours }))
    .sort((a, b) => b.total_hours - a.total_hours);

  res.json({ leave, bt, ot });
});

// "Manage AL, OT & BT" — the oversight page for Head of Department/BOD/
// Admin. Scoped exactly like Employee Master (employeeScopeFor): a Head of
// Department sees their full reporting chain, Admin/BOD see everyone. Two
// things at once, since the page needs both on load: a per-employee
// summary (AL days used/remaining, OT hours, BT trips/days — always
// counting only 'approved'/'cancellation_requested', same as alDaysUsed's
// "actually committed" semantics) for the given calendar year, and the
// full request list (every status, so pending/rejected/draft history is
// visible too, not just what's already decided) for the drill-down table.
requestsRouter.get("/manage", requireCap("request.manageAll"), (req, res) => {
  const year = String(req.query.year ?? new Date().getFullYear());
  if (!/^\d{4}$/.test(year)) {
    res.status(400).json({ error: "year must be a 4-digit year." });
    return;
  }
  // month is optional — omit it for the whole year, or pass 1-12 to narrow
  // to one calendar month within that year.
  const monthParam = req.query.month != null && req.query.month !== "" ? String(req.query.month) : null;
  // Accepts "9" and "09" alike — the UI only ever sends the unpadded form,
  // but a hand-built URL or future caller could reasonably send either.
  if (monthParam !== null && !/^(0?[1-9]|1[0-2])$/.test(monthParam)) {
    res.status(400).json({ error: "month must be between 1 and 12." });
    return;
  }
  const yearMonth = monthParam ? `${year}-${monthParam.padStart(2, "0")}` : null;
  // Matches either the whole year (substr to 4 chars) or one specific
  // year-month (substr to 7 chars, "YYYY-MM") depending on whether a month
  // was given — same prefix compared against a date column either way.
  const datePrefix = yearMonth ?? year;
  const prefixLength = datePrefix.length;

  const me = myEmployeeRow(req.user!);
  const admin = isAdminOversight(req.user!);
  const scope = employeeScopeFor(req.user!);
  const inScope = (employeeId: string) => scope.ids === null || scope.ids.has(employeeId);

  const employees = (
    scope.ids === null
      ? db
          .prepare(
            `SELECT id, employee_code, last_name, middle_name, first_name, english_name, department, commencement_date
             FROM employees WHERE is_archived = 0`,
          )
          .all()
      : db
          .prepare(
            `SELECT id, employee_code, last_name, middle_name, first_name, english_name, department, commencement_date
             FROM employees WHERE is_archived = 0 AND id IN (${[...scope.ids].map(() => "?").join(",") || "NULL"})`,
          )
          .all(...scope.ids)
  ) as {
    id: string;
    employee_code: string | null;
    last_name: string;
    middle_name: string | null;
    first_name: string;
    english_name: string | null;
    department: string | null;
    commencement_date: string | null;
  }[];

  const alRows = db
    .prepare(
      `SELECT r.employee_id, d.days_requested FROM requests r JOIN al_details d ON d.request_id = r.id
       WHERE r.status IN ${DASHBOARD_STATUSES} AND d.leave_type = 'Annual Leave' AND substr(d.start_date, 1, ?) = ?`,
    )
    .all(prefixLength, datePrefix) as { employee_id: string; days_requested: number }[];
  const otRows = db
    .prepare(
      `SELECT r.employee_id, d.total_hours FROM requests r JOIN ot_details d ON d.request_id = r.id
       WHERE r.status IN ${DASHBOARD_STATUSES} AND substr(d.ot_date, 1, ?) = ?`,
    )
    .all(prefixLength, datePrefix) as { employee_id: string; total_hours: number }[];
  const btRows = db
    .prepare(
      `SELECT r.employee_id, d.days_requested FROM requests r JOIN bt_details d ON d.request_id = r.id
       WHERE r.status IN ${DASHBOARD_STATUSES} AND substr(d.departure_at, 1, ?) = ?`,
    )
    .all(prefixLength, datePrefix) as { employee_id: string; days_requested: number }[];

  const alTotals = new Map<string, number>();
  for (const r of alRows) alTotals.set(r.employee_id, (alTotals.get(r.employee_id) ?? 0) + r.days_requested);
  const otTotals = new Map<string, number>();
  for (const r of otRows) otTotals.set(r.employee_id, (otTotals.get(r.employee_id) ?? 0) + r.total_hours);
  const btDaysTotals = new Map<string, number>();
  const btTripCounts = new Map<string, number>();
  for (const r of btRows) {
    btDaysTotals.set(r.employee_id, (btDaysTotals.get(r.employee_id) ?? 0) + r.days_requested);
    btTripCounts.set(r.employee_id, (btTripCounts.get(r.employee_id) ?? 0) + 1);
  }

  const summary = employees.map((e) => ({
    employee_id: e.id,
    employee: {
      id: e.id,
      employee_code: e.employee_code,
      last_name: e.last_name,
      middle_name: e.middle_name,
      first_name: e.first_name,
      english_name: e.english_name,
    },
    department: e.department,
    al_used: alTotals.get(e.id) ?? 0,
    al_entitlement: computeAlEntitlementDays(e.commencement_date),
    // Rounded to 1 decimal for display — total_hours is already rounded
    // to 2 decimals per OT entry (calcOtHours), but summing several can
    // still land on an ugly float (e.g. floating-point 7.550000000000001).
    ot_hours: Math.round((otTotals.get(e.id) ?? 0) * 10) / 10,
    bt_trips: btTripCounts.get(e.id) ?? 0,
    bt_days: btDaysTotals.get(e.id) ?? 0,
  }));

  // Find which requests actually fall in the selected year/month via each
  // type's own detail table (same date columns as the totals above) BEFORE
  // hydrating anything — loadDetail() runs its own extra query per row (the
  // audit-history join), so calling it for every request the company has
  // ever created and only then discarding what's outside the date window
  // (the previous approach) doesn't scale once historical data piles up:
  // it turns one page load into thousands of synchronous SQLite round
  // trips, blocking the whole server long enough to look like a crash.
  const matchingRequestIds = new Set<string>();
  for (const row of db
    .prepare(`SELECT r.id FROM requests r JOIN al_details d ON d.request_id = r.id WHERE substr(d.start_date, 1, ?) = ?`)
    .all(prefixLength, datePrefix) as { id: string }[]) {
    matchingRequestIds.add(row.id);
  }
  for (const row of db
    .prepare(`SELECT r.id FROM requests r JOIN ot_details d ON d.request_id = r.id WHERE substr(d.ot_date, 1, ?) = ?`)
    .all(prefixLength, datePrefix) as { id: string }[]) {
    matchingRequestIds.add(row.id);
  }
  for (const row of db
    .prepare(
      `SELECT r.id FROM requests r JOIN bt_details d ON d.request_id = r.id WHERE substr(d.departure_at, 1, ?) = ?`,
    )
    .all(prefixLength, datePrefix) as { id: string }[]) {
    matchingRequestIds.add(row.id);
  }

  const employeeIdByRequestId = new Map(
    (
      db
        .prepare(
          `SELECT id, employee_id FROM requests WHERE id IN (${[...matchingRequestIds].map(() => "?").join(",") || "NULL"})`,
        )
        .all(...matchingRequestIds) as { id: string; employee_id: string }[]
    ).map((r) => [r.id, r.employee_id]),
  );

  const requests = [...matchingRequestIds]
    .filter((id) => inScope(employeeIdByRequestId.get(id)!))
    .map((id) => loadDetail(id, me?.id, admin)!)
    .sort((a, b) => (b.created_at as string).localeCompare(a.created_at as string));

  res.json({ year, month: monthParam, summary, requests });
});

requestsRouter.get("/approvals", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const admin = isAdminOversight(req.user!);
  if (!admin && !me) {
    res.json([]);
    return;
  }
  const rows = admin
    ? (db
        .prepare("SELECT id FROM requests WHERE status IN ('pending_approval', 'cancellation_requested') ORDER BY submitted_at ASC")
        .all() as { id: string }[])
    : (db
        .prepare(
          "SELECT id FROM requests WHERE approver_id = ? AND status IN ('pending_approval', 'cancellation_requested') ORDER BY submitted_at ASC",
        )
        .all(me!.id) as { id: string }[]);
  res.json(rows.map((r) => loadDetail(r.id, me?.id, admin)!));
});

requestsRouter.get("/:id", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const admin = isAdminOversight(req.user!);
  const row = db.prepare("SELECT employee_id, approver_id FROM requests WHERE id = ?").get(req.params.id) as
    | { employee_id: string; approver_id: string | null }
    | undefined;
  if (!row || !canView(row, me?.id, req.user!)) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  res.json(loadDetail(req.params.id, me?.id, admin));
});

requestsRouter.post("/:id/decide", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const admin = isAdminOversight(req.user!);
  const existing = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as
    | { id: string; approver_id: string | null; status: RequestStatus }
    | undefined;
  if (!existing || !(admin || (me && existing.approver_id === me.id))) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (existing.status !== "pending_approval") {
    res.status(400).json({ error: "This request isn't awaiting a decision." });
    return;
  }
  const { action, comment } = req.body as { action?: string; comment?: string };
  if (!["approve", "reject", "return_for_edit"].includes(action ?? "")) {
    res.status(400).json({ error: "action must be approve, reject, or return_for_edit." });
    return;
  }
  if (action !== "approve" && !comment?.trim()) {
    res.status(400).json({ error: "A comment is required to reject or return a request for edit." });
    return;
  }
  const status = action === "approve" ? "approved" : action === "reject" ? "rejected" : "needs_changes";
  db.prepare(
    "UPDATE requests SET status = ?, decided_by = ?, decided_at = datetime('now'), decision_comment = ?, updated_at = datetime('now') WHERE id = ?",
  ).run(status, req.user!.id, comment?.trim() || null, existing.id);
  logAudit(
    "request",
    existing.id,
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "returned_for_edit",
    req.user!.id,
    "decision_comment",
    null,
    comment?.trim() || null,
  );
  res.json(loadDetail(existing.id, me?.id, admin));
});

requestsRouter.post("/:id/cancel", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const existing = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as
    | { id: string; employee_id: string; status: RequestStatus }
    | undefined;
  if (!existing || !me || existing.employee_id !== me.id) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  const { reason } = req.body as { reason?: string };
  if (["draft", "pending_approval", "needs_changes"].includes(existing.status)) {
    db.prepare("UPDATE requests SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").run(existing.id);
    logAudit("request", existing.id, "cancelled", req.user!.id);
    res.json(loadDetail(existing.id, me.id, isAdminOversight(req.user!)));
    return;
  }
  if (existing.status === "approved") {
    if (!reason?.trim()) {
      res.status(400).json({ error: "A reason is required to request cancellation of an approved request." });
      return;
    }
    db.prepare(
      "UPDATE requests SET status = 'cancellation_requested', cancellation_reason = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(reason.trim(), existing.id);
    logAudit("request", existing.id, "cancellation_requested", req.user!.id, "cancellation_reason", null, reason.trim());
    res.json(loadDetail(existing.id, me.id, isAdminOversight(req.user!)));
    return;
  }
  res.status(400).json({ error: "This request can't be cancelled from its current status." });
});

// A genuine hard delete — unlike /cancel above (which only flips status and
// keeps the row for history), this removes it entirely. al_details/
// ot_details/bt_details cascade automatically (ON DELETE CASCADE — see
// migrations/0023_al_ot_bt_requests.sql), and its audit_log rows are
// deliberately left in place afterward — same precedent as the employees
// hard-delete in routes/employees.ts (no FK ties audit_log to the now-gone
// row, and the audit trail itself isn't what's being reset here).
//
// Self can only delete their own request while it hasn't taken effect and
// isn't actively awaiting someone else's decision — an in-flight
// (pending_approval) or already-approved/cancellation_requested request
// should go through Cancel/Request Cancellation instead, which preserves a
// record of what happened. Admin/BOD have no such restriction — full
// oversight, any status, same unconditional bypass isAdminOversight grants
// everywhere else in this file.
requestsRouter.delete("/:id", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const admin = isAdminOversight(req.user!);
  const existing = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as
    | { id: string; employee_id: string; status: RequestStatus }
    | undefined;
  if (!existing) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  const isOwner = me != null && existing.employee_id === me.id;
  if (!admin && !isOwner) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (!admin && !SELF_DELETABLE_STATUSES.includes(existing.status)) {
    res.status(400).json({ error: "This request can't be deleted from its current status — cancel it first." });
    return;
  }
  logAudit("request", existing.id, "deleted", req.user!.id, "status", existing.status, null);
  db.prepare("DELETE FROM requests WHERE id = ?").run(existing.id);
  res.json({ deleted: true });
});

requestsRouter.post("/:id/decide-cancellation", (req, res) => {
  const me = myEmployeeRow(req.user!);
  const admin = isAdminOversight(req.user!);
  const existing = db.prepare("SELECT * FROM requests WHERE id = ?").get(req.params.id) as
    | { id: string; approver_id: string | null; status: RequestStatus }
    | undefined;
  if (!existing || !(admin || (me && existing.approver_id === me.id))) {
    res.status(404).json({ error: "Request not found." });
    return;
  }
  if (existing.status !== "cancellation_requested") {
    res.status(400).json({ error: "This request has no pending cancellation." });
    return;
  }
  const { confirm } = req.body as { confirm?: boolean };
  const status = confirm ? "cancelled" : "approved";
  db.prepare("UPDATE requests SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, existing.id);
  logAudit("request", existing.id, confirm ? "cancellation_confirmed" : "cancellation_denied", req.user!.id);
  res.json(loadDetail(existing.id, me?.id, admin));
});
