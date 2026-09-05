import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Papa from "papaparse";
import { api } from "../lib/api";
import type { EmployeeInput } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";
import { normalizePhone } from "../lib/employeeOptions";
import { OffshoreIcon } from "../components/OffshoreIcon";

type ImportMode = "create" | "update";

type ImportRow = EmployeeInput & { is_archived: boolean };

interface ParsedRow {
  mapped: ImportRow;
  errors: string[];
  warnings: string[];
}

// Excel silently rewrites a long digit string (like a phone number) typed
// into a numeric-formatted cell as scientific notation — e.g. "0986993064"
// becomes "9.86993e+008". The original digits beyond what the mantissa kept
// are gone for good; this can only be detected, not repaired, from the CSV.
function looksCorrupted(value: string | undefined): boolean {
  if (!value) return false;
  return /^\d(\.\d+)?e\+\d+$/i.test(value.trim());
}

// A slash-separated date can't be told apart as MM/DD/YYYY vs DD/MM/YYYY
// from its digits alone (e.g. "03/05/2024" is ambiguous either way) — the
// export's actual convention depends on the machine/locale that produced
// it, so the user picks it once per import rather than the app guessing.
export type DateFormat = "MDY" | "DMY";

interface ParsedDate {
  value: string | null;
  invalid: boolean;
}

function parseDate(raw: string | undefined, format: DateFormat): ParsedDate {
  const trimmed = raw?.trim();
  if (!trimmed) return { value: null, invalid: false };

  // Excel sometimes exports a date-typed cell with a trailing midnight
  // timestamp (e.g. "6/25/2024 0:00:00") — never meaningful for these
  // fields, so it's dropped before matching.
  const withoutTime = trimmed.replace(/\s+\d{1,2}:\d{2}(:\d{2})?\s*$/, "");

  // Already unambiguous (YYYY-MM-DD) — stored as-is, no MDY/DMY guessing.
  const iso = withoutTime.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    const invalid = Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31;
    return { value: invalid ? null : `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`, invalid };
  }

  // Accepts "/", "-", or "." as the separator between day/month and year —
  // a real export doesn't always use "/".
  const m = withoutTime.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  if (!m) {
    // Non-empty but didn't match anything recognized — surfaced as a
    // warning rather than silently dropped, so a format this parser
    // doesn't handle yet gets noticed instead of quietly importing blank.
    return { value: null, invalid: true };
  }
  const [, a, b, year] = m;
  const month = format === "MDY" ? a : b;
  const day = format === "MDY" ? b : a;
  const invalid = Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31;
  // Don't hand back a malformed value (e.g. month "13") for a date that
  // failed validation — the row still imports (see warnings), but the date
  // field itself is left blank rather than storing something unparseable.
  return { value: invalid ? null : `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`, invalid };
}

// A tick-style CSV column ("Off-shore") could come back as any of several
// common truthy spellings depending on how it was entered — anything else
// (blank, "no", "false") is treated as unticked.
function isTruthy(value: string | undefined): boolean {
  const v = value?.trim().toLowerCase();
  return v === "yes" || v === "y" || v === "true" || v === "1" || v === "x";
}

// --- Column mapping ---------------------------------------------------
//
// A real HR export's exact header wording varies (case, "Length of
// Contract" vs "Contract Length", trailing spaces, ...) — rather than
// guessing silently, every column is matched explicitly: the file's actual
// headers are detected once on upload, a best-guess mapping is proposed
// (case-insensitive, and trying a couple of known alternate spellings per
// field), and the user reviews/corrects it in the "Map Columns" section
// before anything is parsed into rows.
interface FieldSpec {
  key: string;
  label: string;
  aliases: string[];
}

const IDENTITY_FIELDS: FieldSpec[] = [{ key: "employee_code", label: "Employee ID", aliases: ["Employee ID"] }];

const WORK_FIELDS: FieldSpec[] = [
  { key: "work_email", label: "Work Email", aliases: ["Work Email"] },
  { key: "phone_no", label: "Phone No.", aliases: ["Phone No."] },
  { key: "department", label: "Department", aliases: ["Department"] },
  { key: "position", label: "Position", aliases: ["Position"] },
  { key: "office_location", label: "Office Location", aliases: ["Office Location"] },
  { key: "commencement_date", label: "Commencement Date", aliases: ["Commencement Date"] },
  { key: "is_offshore", label: "Off-shore", aliases: ["Off-shore"] },
];

const PERSONAL_FIELDS: FieldSpec[] = [
  { key: "last_name", label: "Last Name", aliases: ["Last Name"] },
  { key: "middle_name", label: "Middle Name", aliases: ["Middle Name"] },
  { key: "first_name", label: "First Name", aliases: ["First Name"] },
  { key: "english_name", label: "English Name", aliases: ["English Name"] },
  { key: "gender", label: "Gender", aliases: ["Gender"] },
  { key: "marital_status", label: "Marital Status", aliases: ["Marital Status"] },
  { key: "birthday", label: "Birthday", aliases: ["Birthday"] },
  { key: "nationality", label: "Nationality", aliases: ["Nationality"] },
];

const IDENTIFICATION_FIELDS: FieldSpec[] = [
  { key: "id_no", label: "ID No.", aliases: ["ID No."] },
  { key: "issued_date", label: "Issued Date", aliases: ["Issued Date"] },
  { key: "passport_no", label: "Passport No.", aliases: ["Passport No."] },
];

const CONTRACT_FIELDS: FieldSpec[] = [
  { key: "contract_type", label: "Contract Type", aliases: ["Contract Type"] },
  { key: "contract_length", label: "Contract Length", aliases: ["Contract Length", "Length of Contract"] },
  { key: "contract_no", label: "Contract No.", aliases: ["Contract No."] },
  { key: "contract_start_date", label: "Contract Start Date", aliases: ["Contract Start Date", "Start Date"] },
  { key: "contract_end_date", label: "Contract End Date", aliases: ["Contract End Date", "End Date"] },
];

const FINANCIAL_FIELDS: FieldSpec[] = [
  { key: "personal_tax_no", label: "Personal Tax No.", aliases: ["Personal Tax No."] },
  { key: "bank_account_no", label: "Bank Account No.", aliases: ["Bank Account No."] },
  { key: "bank_name", label: "Bank Name", aliases: ["Bank Name"] },
  { key: "health_insurance", label: "Health Insurance", aliases: ["Health Insurance"] },
];

const ADDRESS_FIELDS: FieldSpec[] = [
  { key: "permanent_address", label: "Permanent Address", aliases: ["Permanent Address"] },
  { key: "temporary_address", label: "Temporary Address", aliases: ["Temporary Address"] },
];

const EMERGENCY_FIELDS: FieldSpec[] = [
  { key: "emergency_contact", label: "Emergency Contact", aliases: ["Emergency Contact"] },
  { key: "relationship", label: "Relationship", aliases: ["Relationship"] },
  { key: "contact_phone_no", label: "Contact Phone No.", aliases: ["Contact Phone No."] },
];

const STATUS_FIELDS: FieldSpec[] = [{ key: "is_archived", label: "Archived", aliases: ["Archived"] }];

// Employee ID only matters as a match key in update mode — create mode
// never sets it (the server always auto-generates it), so that section is
// left out there (see the sections computed in the component below).
const COMMON_SECTIONS: { title: string; fields: FieldSpec[] }[] = [
  { title: "Work Information", fields: WORK_FIELDS },
  { title: "Personal Information", fields: PERSONAL_FIELDS },
  { title: "Identification", fields: IDENTIFICATION_FIELDS },
  { title: "Contract Information", fields: CONTRACT_FIELDS },
  { title: "Financial", fields: FINANCIAL_FIELDS },
  { title: "Address", fields: ADDRESS_FIELDS },
  { title: "Emergency Contact", fields: EMERGENCY_FIELDS },
  { title: "Status", fields: STATUS_FIELDS },
];

function fieldSectionsFor(mode: ImportMode): { title: string; fields: FieldSpec[] }[] {
  return mode === "update" ? [{ title: "Matching", fields: IDENTITY_FIELDS }, ...COMMON_SECTIONS] : COMMON_SECTIONS;
}

function detectHeader(headers: string[], aliases: string[]): string {
  const lower = headers.map((h) => h.toLowerCase());
  for (const alias of aliases) {
    const idx = lower.indexOf(alias.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return "";
}

function buildAutoMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (const spec of [...IDENTITY_FIELDS, ...COMMON_SECTIONS.flatMap((s) => s.fields)]) {
    mapping[spec.key] = detectHeader(headers, spec.aliases);
  }
  return mapping;
}

function mappedRaw(raw: Record<string, string>, mapping: Record<string, string>, key: string): string | undefined {
  const header = mapping[key];
  return header ? raw[header] : undefined;
}

function mappedField(raw: Record<string, string>, mapping: Record<string, string>, key: string): string | null {
  return mappedRaw(raw, mapping, key)?.trim() || null;
}

// --- Row mapping --------------------------------------------------------
//
// Shared between both import modes — every plain (non-relational) field,
// which is the entire column set a create AND an update CSV can carry.
// Create additionally sets rank/career_map_role_id/report_to_employee_id/
// is_offshore/is_archived (see mapCreateRow); update additionally reads
// Employee ID as a match key (see mapUpdateRow) instead of touching any of
// those.
interface PlainFields {
  work_email: string | null;
  last_name: string | null;
  middle_name: string | null;
  first_name: string | null;
  english_name: string | null;
  department: string | null;
  position: string | null;
  office_location: string | null;
  commencement_date: string | null;
  phone_no: string | null;
  personal_tax_no: string | null;
  bank_account_no: string | null;
  bank_name: string | null;
  gender: string | null;
  marital_status: string | null;
  birthday: string | null;
  id_no: string | null;
  issued_date: string | null;
  passport_no: string | null;
  nationality: string | null;
  permanent_address: string | null;
  temporary_address: string | null;
  emergency_contact: string | null;
  relationship: string | null;
  contact_phone_no: string | null;
  health_insurance: string | null;
  contract_type: string | null;
  contract_length: string | null;
  contract_no: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
}

function mapPlainFields(
  raw: Record<string, string>,
  mapping: Record<string, string>,
  dateFormat: DateFormat,
): { mapped: PlainFields; warnings: string[] } {
  const warnings: string[] = [];
  const phone = normalizePhone(mappedField(raw, mapping, "phone_no"));
  const contactPhone = normalizePhone(mappedField(raw, mapping, "contact_phone_no"));
  if (looksCorrupted(mappedRaw(raw, mapping, "phone_no"))) {
    warnings.push("Phone No. looks corrupted by Excel (scientific notation) — original digits are likely lost");
  }
  if (looksCorrupted(mappedRaw(raw, mapping, "contact_phone_no"))) {
    warnings.push("Contact Phone No. looks corrupted by Excel (scientific notation) — original digits are likely lost");
  }

  const commencementDate = parseDate(mappedRaw(raw, mapping, "commencement_date"), dateFormat);
  const birthday = parseDate(mappedRaw(raw, mapping, "birthday"), dateFormat);
  const issuedDate = parseDate(mappedRaw(raw, mapping, "issued_date"), dateFormat);
  const contractStart = parseDate(mappedRaw(raw, mapping, "contract_start_date"), dateFormat);
  const contractEnd = parseDate(mappedRaw(raw, mapping, "contract_end_date"), dateFormat);
  if (commencementDate.invalid) {
    warnings.push(`Commencement Date "${mappedRaw(raw, mapping, "commencement_date")}" couldn't be parsed as a date`);
  }
  if (birthday.invalid) warnings.push(`Birthday "${mappedRaw(raw, mapping, "birthday")}" couldn't be parsed as a date`);
  if (issuedDate.invalid) {
    warnings.push(`Issued Date "${mappedRaw(raw, mapping, "issued_date")}" couldn't be parsed as a date`);
  }
  if (contractStart.invalid) {
    warnings.push(`Contract Start Date "${mappedRaw(raw, mapping, "contract_start_date")}" couldn't be parsed as a date`);
  }
  if (contractEnd.invalid) {
    warnings.push(`Contract End Date "${mappedRaw(raw, mapping, "contract_end_date")}" couldn't be parsed as a date`);
  }

  return {
    mapped: {
      work_email: mappedField(raw, mapping, "work_email"),
      last_name: mappedField(raw, mapping, "last_name"),
      middle_name: mappedField(raw, mapping, "middle_name"),
      first_name: mappedField(raw, mapping, "first_name"),
      english_name: mappedField(raw, mapping, "english_name"),
      department: mappedField(raw, mapping, "department"),
      position: mappedField(raw, mapping, "position"),
      office_location: mappedField(raw, mapping, "office_location"),
      commencement_date: commencementDate.value,
      phone_no: phone,
      personal_tax_no: mappedField(raw, mapping, "personal_tax_no"),
      bank_account_no: mappedField(raw, mapping, "bank_account_no"),
      bank_name: mappedField(raw, mapping, "bank_name"),
      gender: mappedField(raw, mapping, "gender"),
      marital_status: mappedField(raw, mapping, "marital_status"),
      birthday: birthday.value,
      id_no: mappedField(raw, mapping, "id_no"),
      issued_date: issuedDate.value,
      passport_no: mappedField(raw, mapping, "passport_no"),
      nationality: mappedField(raw, mapping, "nationality"),
      permanent_address: mappedField(raw, mapping, "permanent_address"),
      temporary_address: mappedField(raw, mapping, "temporary_address"),
      emergency_contact: mappedField(raw, mapping, "emergency_contact"),
      relationship: mappedField(raw, mapping, "relationship"),
      contact_phone_no: contactPhone,
      health_insurance: mappedField(raw, mapping, "health_insurance"),
      contract_type: mappedField(raw, mapping, "contract_type"),
      contract_length: mappedField(raw, mapping, "contract_length"),
      contract_no: mappedField(raw, mapping, "contract_no"),
      contract_start_date: contractStart.value,
      contract_end_date: contractEnd.value,
    },
    warnings,
  };
}

function mapCreateRow(raw: Record<string, string>, mapping: Record<string, string>, dateFormat: DateFormat): ParsedRow {
  const errors: string[] = [];
  const { mapped: plain, warnings } = mapPlainFields(raw, mapping, dateFormat);
  if (!plain.last_name) errors.push("Missing Last Name");
  if (!plain.first_name) errors.push("Missing First Name");

  const mapped: ImportRow = {
    ...plain,
    last_name: plain.last_name ?? "",
    first_name: plain.first_name ?? "",
    rank: null,
    career_map_role_id: null,
    // Not part of the CSV mapping — set manually per employee afterward
    // (same reasoning as career_map_role_id above).
    report_to_employee_id: null,
    is_offshore: isTruthy(mappedRaw(raw, mapping, "is_offshore")),
    is_archived: mappedRaw(raw, mapping, "is_archived")?.trim().toLowerCase() === "archived",
  };
  return { mapped, errors, warnings };
}

// Update mode never creates a person — it only patches an EXISTING employee
// matched by Employee ID or Work Email, and only touches fields the CSV
// actually has a value for (see routes/employees.ts's POST /import/update).
// So unlike create, there's no "Missing Last Name" style validation here —
// the only thing that can go wrong client-side is a row with neither match
// key at all, which is flagged but still submitted (the server would skip
// it anyway; flagging it just saves the round trip of finding out).
export interface UpdateMappedRow extends PlainFields {
  employee_code: string | null;
}

interface UpdateParsedRow {
  mapped: UpdateMappedRow;
  warnings: string[];
  hasMatchKey: boolean;
  fieldCount: number;
}

function mapUpdateRow(raw: Record<string, string>, mapping: Record<string, string>, dateFormat: DateFormat): UpdateParsedRow {
  const { mapped: plain, warnings } = mapPlainFields(raw, mapping, dateFormat);
  const employeeCode = mappedField(raw, mapping, "employee_code");
  const mapped: UpdateMappedRow = { ...plain, employee_code: employeeCode };
  const fieldCount = Object.entries(plain).filter(([, v]) => v).length;
  return { mapped, warnings, hasMatchKey: Boolean(employeeCode || plain.work_email), fieldCount };
}

interface UpdateImportResult {
  updated: number;
  skipped: number;
  results: { row: number; status: "updated" | "skipped"; reason?: string }[];
}

export function EmployeeImportPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ImportMode>("create");
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<Record<string, string>[] | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [dateFormat, setDateFormat] = useState<DateFormat>("MDY");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [updateResult, setUpdateResult] = useState<UpdateImportResult | null>(null);

  const sections = fieldSectionsFor(mode);

  // Re-mapped whenever the mode, mapping, or date format changes, not just
  // on upload — so adjusting a column mapping, switching Create <-> Update,
  // or MM/DD <-> DD/MM re-evaluates every row without needing to re-upload.
  const createRows = useMemo<ParsedRow[] | null>(
    () => (mode === "create" ? (rawRows?.map((r) => mapCreateRow(r, columnMapping, dateFormat)) ?? null) : null),
    [rawRows, dateFormat, mode, columnMapping],
  );
  const updateRows = useMemo<UpdateParsedRow[] | null>(
    () => (mode === "update" ? (rawRows?.map((r) => mapUpdateRow(r, columnMapping, dateFormat)) ?? null) : null),
    [rawRows, dateFormat, mode, columnMapping],
  );

  function resetOutcome() {
    setParseError(null);
    setImportedCount(null);
    setImportError(null);
    setUpdateResult(null);
  }

  function handleModeChange(next: ImportMode) {
    setMode(next);
    resetOutcome();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    resetOutcome();
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message);
          setRawRows(null);
          setHeaders([]);
          return;
        }
        const detected = results.meta.fields ?? [];
        setHeaders(detected);
        setColumnMapping(buildAutoMapping(detected));
        setRawRows(results.data);
      },
      error: (err) => setParseError(err.message),
    });
  }

  function setMappingFor(key: string, header: string) {
    setColumnMapping((m) => ({ ...m, [key]: header }));
  }

  const errorCount = createRows?.filter((r) => r.errors.length > 0).length ?? 0;
  const warningCount =
    mode === "create"
      ? (createRows?.filter((r) => r.warnings.length > 0).length ?? 0)
      : (updateRows?.filter((r) => r.warnings.length > 0).length ?? 0);
  const noMatchKeyCount = updateRows?.filter((r) => !r.hasMatchKey).length ?? 0;

  async function handleImport() {
    setImporting(true);
    setImportError(null);
    try {
      if (mode === "create") {
        if (!createRows) return;
        const { created } = await api.post<{ created: number }>("/employees/import", {
          rows: createRows.map((r) => r.mapped),
        });
        setImportedCount(created);
      } else {
        if (!updateRows) return;
        const result = await api.post<UpdateImportResult>("/employees/import/update", {
          rows: updateRows.map((r) => r.mapped),
        });
        setUpdateResult(result);
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setImporting(false);
    }
  }

  const done = importedCount !== null || updateResult !== null;

  return (
    <div className="max-w-4xl">
      <Link to="/employees" className="text-sm text-accent hover:underline">
        ← Employee Master
      </Link>
      <h1 className="font-display font-bold text-xl mt-1 mb-1">Import employees</h1>
      <p className="text-sm text-ink-muted mb-4">
        Upload a CSV, then confirm which of its columns map to which Employee Master field. Nothing is saved until
        you review the preview below and confirm.
      </p>

      {done ? (
        <div className="card">
          {importedCount !== null && (
            <p className="text-sm font-medium mb-3">
              Imported {importedCount} employee{importedCount === 1 ? "" : "s"}.
            </p>
          )}
          {updateResult !== null && (
            <>
              <p className="text-sm font-medium mb-2">
                Updated {updateResult.updated} employee{updateResult.updated === 1 ? "" : "s"}
                {updateResult.skipped > 0
                  ? `, skipped ${updateResult.skipped} row${updateResult.skipped === 1 ? "" : "s"}.`
                  : "."}
              </p>
              {updateResult.skipped > 0 && (
                <ul className="text-sm text-amber-700 mb-3 list-disc pl-5">
                  {updateResult.results
                    .filter((r) => r.status === "skipped")
                    .map((r) => (
                      <li key={r.row}>
                        Row {r.row + 1}: {r.reason}
                      </li>
                    ))}
                </ul>
              )}
            </>
          )}
          <Link to="/employees" className="btn-primary inline-block">
            Back to Employee Master
          </Link>
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <div className="text-sm mb-3">
              <span className="font-medium">Import type</span>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="importMode"
                    checked={mode === "create"}
                    onChange={() => handleModeChange("create")}
                  />
                  Create new employees
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    name="importMode"
                    checked={mode === "update"}
                    onChange={() => handleModeChange("update")}
                  />
                  Update existing employees only
                </label>
              </div>
              {mode === "update" && (
                <p className="text-xs text-ink-faint mt-1">
                  Matches each row to an existing employee by Employee ID or Work Email, and only changes the
                  fields that have a value in the CSV — a blank cell leaves the current value alone. Rows that
                  don't match anyone are skipped, not treated as an error.
                </p>
              )}
            </div>

            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">CSV file</span>
              <input className="input" type="file" accept=".csv" onChange={handleFile} />
            </label>
            {parseError && <p className="text-sm text-red-600 mt-2">Couldn't parse this file: {parseError}</p>}
          </div>

          {headers.length > 0 && (
            <div className="card mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">Map Columns</span>
                <button
                  type="button"
                  className="text-xs text-accent hover:underline"
                  onClick={() => setColumnMapping(buildAutoMapping(headers))}
                >
                  Reset to auto-detected
                </button>
              </div>
              <p className="text-xs text-ink-faint mb-3">
                Confirm which column in {fileName} corresponds to each field below — auto-matched where the header
                name is recognized. Leave one set to "—" to skip that field entirely.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {sections.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5">
                      {section.title}
                    </h3>
                    <div className="flex flex-col gap-1.5">
                      {section.fields.map((f) => (
                        <label key={f.key} className="flex items-center gap-2 text-sm">
                          <span className="w-36 shrink-0 truncate" title={f.label}>
                            {f.label}
                          </span>
                          <select
                            className="input !w-auto flex-1 py-1"
                            value={columnMapping[f.key] ?? ""}
                            onChange={(e) => setMappingFor(f.key, e.target.value)}
                          >
                            <option value="">—</option>
                            {headers.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 text-sm border-t border-border pt-3">
                <span className="font-medium">Date format in this file</span>
                <p className="text-xs text-ink-faint mb-1">
                  Applies to every mapped date column. A date like 03/05/2024 is ambiguous by itself — pick
                  whichever order this file actually uses.
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="dateFormat"
                      checked={dateFormat === "MDY"}
                      onChange={() => setDateFormat("MDY")}
                    />
                    MM/DD/YYYY
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="dateFormat"
                      checked={dateFormat === "DMY"}
                      onChange={() => setDateFormat("DMY")}
                    />
                    DD/MM/YYYY
                  </label>
                </div>
              </div>
            </div>
          )}

          {mode === "create" && createRows && (
            <>
              <div className="card mb-4 flex flex-col gap-1 text-sm">
                <p>
                  <span className="font-medium">{fileName}</span> — {createRows.length} row
                  {createRows.length === 1 ? "" : "s"} parsed.
                </p>
                {errorCount > 0 && (
                  <p className="text-red-600">
                    {errorCount} row{errorCount === 1 ? "" : "s"} can't be imported (missing required fields) — fix
                    the mapping (or the CSV) above. Nothing will be imported while any row has an error.
                  </p>
                )}
                {warningCount > 0 && (
                  <p className="text-amber-700">
                    {warningCount} row{warningCount === 1 ? "" : "s"} flagged for review (see below) — these will
                    still import, just double-check them afterward.
                  </p>
                )}
              </div>

              <div className="card !p-0 overflow-hidden overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                      <th className="px-4 py-2 font-medium">Name</th>
                      <th className="px-4 py-2 font-medium">Department</th>
                      <th className="px-4 py-2 font-medium">Position</th>
                      <th className="px-4 py-2 font-medium">Office Location</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 font-medium">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {createRows.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-border last:border-0 ${r.errors.length > 0 ? "bg-red-50" : ""}`}
                      >
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center gap-1.5">
                            {employeeDisplayName(r.mapped) || "—"}
                            {r.mapped.is_offshore && <OffshoreIcon className="w-4 h-4 shrink-0" />}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-ink-muted">{r.mapped.department || "—"}</td>
                        <td className="px-4 py-2 text-ink-muted">{r.mapped.position || "—"}</td>
                        <td className="px-4 py-2 text-ink-muted">{r.mapped.office_location || "—"}</td>
                        <td className="px-4 py-2 text-ink-muted">{r.mapped.is_archived ? "Archived" : "On-going"}</td>
                        <td className="px-4 py-2">
                          {r.errors.map((e, j) => (
                            <div key={j} className="text-red-600 text-xs">
                              {e}
                            </div>
                          ))}
                          {r.warnings.map((w, j) => (
                            <div key={j} className="text-amber-700 text-xs">
                              {w}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importError && <p className="text-sm text-red-600 mb-3">{importError}</p>}
              <div className="flex gap-2">
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={importing || errorCount > 0}
                  type="button"
                >
                  {importing ? "Importing…" : `Import ${createRows.length} employee${createRows.length === 1 ? "" : "s"}`}
                </button>
                <button className="btn-secondary" onClick={() => navigate(-1)} type="button">
                  Cancel
                </button>
              </div>
            </>
          )}

          {mode === "update" && updateRows && (
            <>
              <div className="card mb-4 flex flex-col gap-1 text-sm">
                <p>
                  <span className="font-medium">{fileName}</span> — {updateRows.length} row
                  {updateRows.length === 1 ? "" : "s"} parsed.
                </p>
                {noMatchKeyCount > 0 && (
                  <p className="text-amber-700">
                    {noMatchKeyCount} row{noMatchKeyCount === 1 ? "" : "s"} have neither an Employee ID nor a Work
                    Email — those will be skipped.
                  </p>
                )}
                {warningCount > 0 && (
                  <p className="text-amber-700">
                    {warningCount} row{warningCount === 1 ? "" : "s"} flagged for review (see below).
                  </p>
                )}
              </div>

              <div className="card !p-0 overflow-hidden overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface-2 text-left text-ink-muted">
                      <th className="px-4 py-2 font-medium">Employee ID</th>
                      <th className="px-4 py-2 font-medium">Work Email</th>
                      <th className="px-4 py-2 font-medium">Fields to Update</th>
                      <th className="px-4 py-2 font-medium">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {updateRows.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-border last:border-0 ${!r.hasMatchKey ? "bg-amber-50" : ""}`}
                      >
                        <td className="px-4 py-2 font-mono text-xs text-ink-muted">{r.mapped.employee_code || "—"}</td>
                        <td className="px-4 py-2 text-ink-muted">{r.mapped.work_email || "—"}</td>
                        <td className="px-4 py-2 text-ink-muted">{r.fieldCount}</td>
                        <td className="px-4 py-2">
                          {!r.hasMatchKey && (
                            <div className="text-amber-700 text-xs">No Employee ID or Work Email — will skip</div>
                          )}
                          {r.warnings.map((w, j) => (
                            <div key={j} className="text-amber-700 text-xs">
                              {w}
                            </div>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importError && <p className="text-sm text-red-600 mb-3">{importError}</p>}
              <div className="flex gap-2">
                <button
                  className="btn-primary"
                  onClick={handleImport}
                  disabled={importing || noMatchKeyCount === updateRows.length}
                  type="button"
                >
                  {importing ? "Updating…" : `Update ${updateRows.length - noMatchKeyCount} employee${updateRows.length - noMatchKeyCount === 1 ? "" : "s"}`}
                </button>
                <button className="btn-secondary" onClick={() => navigate(-1)} type="button">
                  Cancel
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
