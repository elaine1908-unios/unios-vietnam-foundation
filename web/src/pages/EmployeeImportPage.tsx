import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Papa from "papaparse";
import { api } from "../lib/api";
import type { EmployeeInput } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";

// Column headers as they appear in the real HR export ("Employee Information
// _ Thông tin nhân viên.csv") — trimmed via Papa's transformHeader, since a
// few (e.g. "ID No. ", "Contact Phone No. ") carry a trailing space in the
// source file.
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
  const m = raw?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return { value: null, invalid: false };
  const [, a, b, year] = m;
  const month = format === "MDY" ? a : b;
  const day = format === "MDY" ? b : a;
  const invalid = Number(month) < 1 || Number(month) > 12 || Number(day) < 1 || Number(day) > 31;
  // Don't hand back a malformed value (e.g. month "13") for a date that
  // failed validation — the row still imports (see warnings), but the date
  // field itself is left blank rather than storing something unparseable.
  return { value: invalid ? null : `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`, invalid };
}

function field(raw: Record<string, string>, key: string): string | null {
  return raw[key]?.trim() || null;
}

function mapRow(raw: Record<string, string>, dateFormat: DateFormat): ParsedRow {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lastName = field(raw, "Last Name");
  const firstName = field(raw, "First Name");
  if (!lastName) errors.push("Missing Last Name");
  if (!firstName) errors.push("Missing First Name");

  const phone = field(raw, "Phone No.");
  const contactPhone = field(raw, "Contact Phone No.");
  if (looksCorrupted(raw["Phone No."])) {
    warnings.push("Phone No. looks corrupted by Excel (scientific notation) — original digits are likely lost");
  }
  if (looksCorrupted(raw["Contact Phone No."])) {
    warnings.push("Contact Phone No. looks corrupted by Excel (scientific notation) — original digits are likely lost");
  }

  const commencementDate = parseDate(raw["Commencement Date"], dateFormat);
  const birthday = parseDate(raw["Birthday"], dateFormat);
  const issuedDate = parseDate(raw["Issued Date"], dateFormat);
  if (commencementDate.invalid) warnings.push(`Commencement Date "${raw["Commencement Date"]}" isn't a valid date in the selected format`);
  if (birthday.invalid) warnings.push(`Birthday "${raw["Birthday"]}" isn't a valid date in the selected format`);
  if (issuedDate.invalid) warnings.push(`Issued Date "${raw["Issued Date"]}" isn't a valid date in the selected format`);

  const mapped: ImportRow = {
    work_email: field(raw, "Work Email"),
    last_name: lastName ?? "",
    middle_name: field(raw, "Middle Name"),
    first_name: firstName ?? "",
    english_name: field(raw, "English Name"),
    department: field(raw, "Department"),
    position: field(raw, "Position"),
    rank: null,
    career_map_role_id: null,
    office_location: field(raw, "Office Location"),
    commencement_date: commencementDate.value,
    phone_no: phone,
    personal_tax_no: field(raw, "Personal Tax No."),
    bank_account_no: field(raw, "Bank Account No."),
    bank_name: field(raw, "Bank Name"),
    gender: field(raw, "Gender"),
    marital_status: field(raw, "Marital Status"),
    birthday: birthday.value,
    id_no: field(raw, "ID No."),
    issued_date: issuedDate.value,
    passport_no: field(raw, "Passport No."),
    nationality: field(raw, "Nationality"),
    permanent_address: field(raw, "Permanent Address"),
    temporary_address: field(raw, "Temporary Address"),
    emergency_contact: field(raw, "Emergency Contact"),
    relationship: field(raw, "Relationship"),
    contact_phone_no: contactPhone,
    health_insurance: field(raw, "Health Insurance"),
    is_archived: raw["Archived"]?.trim().toLowerCase() === "archived",
  };
  return { mapped, errors, warnings };
}

export function EmployeeImportPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [rawRows, setRawRows] = useState<Record<string, string>[] | null>(null);
  const [dateFormat, setDateFormat] = useState<DateFormat>("MDY");
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  // Re-mapped whenever the date format toggle changes, not just on upload —
  // so switching MM/DD <-> DD/MM re-evaluates every date without needing to
  // re-upload the file.
  const rows = useMemo<ParsedRow[] | null>(
    () => rawRows?.map((r) => mapRow(r, dateFormat)) ?? null,
    [rawRows, dateFormat],
  );

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError(null);
    setImportedCount(null);
    setImportError(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message);
          setRawRows(null);
          return;
        }
        setRawRows(results.data);
      },
      error: (err) => setParseError(err.message),
    });
  }

  const errorCount = rows?.filter((r) => r.errors.length > 0).length ?? 0;
  const warningCount = rows?.filter((r) => r.warnings.length > 0).length ?? 0;

  async function handleImport() {
    if (!rows) return;
    setImporting(true);
    setImportError(null);
    try {
      const { created } = await api.post<{ created: number }>("/employees/import", {
        rows: rows.map((r) => r.mapped),
      });
      setImportedCount(created);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <Link to="/employees" className="text-sm text-accent hover:underline">
        ← Employee Master
      </Link>
      <h1 className="font-display font-bold text-xl mt-1 mb-1">Import employees</h1>
      <p className="text-sm text-ink-muted mb-4">
        Upload a CSV matching the Employee Master column headers. Nothing is saved until you review the preview
        below and click Import.
      </p>

      {importedCount !== null ? (
        <div className="card">
          <p className="text-sm font-medium mb-3">Imported {importedCount} employee{importedCount === 1 ? "" : "s"}.</p>
          <Link to="/employees" className="btn-primary inline-block">
            Back to Employee Master
          </Link>
        </div>
      ) : (
        <>
          <div className="card mb-4">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium">CSV file</span>
              <input className="input" type="file" accept=".csv" onChange={handleFile} />
            </label>
            {parseError && <p className="text-sm text-red-600 mt-2">Couldn't parse this file: {parseError}</p>}

            <div className="mt-3 text-sm">
              <span className="font-medium">Date format in this file</span>
              <p className="text-xs text-ink-faint mb-1">
                Applies to Commencement Date, Birthday, and Issued Date. A date like 03/05/2024 is ambiguous by
                itself — pick whichever order this file actually uses.
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

          {rows && (
            <>
              <div className="card mb-4 flex flex-col gap-1 text-sm">
                <p>
                  <span className="font-medium">{fileName}</span> — {rows.length} row{rows.length === 1 ? "" : "s"} parsed.
                </p>
                {errorCount > 0 && (
                  <p className="text-red-600">
                    {errorCount} row{errorCount === 1 ? "" : "s"} can't be imported (missing required fields) — fix
                    them in the CSV and re-upload. Nothing will be imported while any row has an error.
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
                    {rows.map((r, i) => (
                      <tr
                        key={i}
                        className={`border-b border-border last:border-0 ${r.errors.length > 0 ? "bg-red-50" : ""}`}
                      >
                        <td className="px-4 py-2">{employeeDisplayName(r.mapped) || "—"}</td>
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
                  {importing ? "Importing…" : `Import ${rows.length} employee${rows.length === 1 ? "" : "s"}`}
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
