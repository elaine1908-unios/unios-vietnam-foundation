import { useState } from "react";
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

// The source file's dates are US-style M/D/Y (confirmed by rows with a day
// > 12, which rules out D/M/Y) — converted to the ISO format the app's
// <input type="date"> fields expect.
function parseUsDate(raw: string | undefined): string | null {
  const m = raw?.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, month, day, year] = m;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function field(raw: Record<string, string>, key: string): string | null {
  return raw[key]?.trim() || null;
}

function mapRow(raw: Record<string, string>): ParsedRow {
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
    commencement_date: parseUsDate(raw["Commencement Date"]),
    phone_no: phone,
    personal_tax_no: field(raw, "Personal Tax No."),
    bank_account_no: field(raw, "Bank Account No."),
    bank_name: field(raw, "Bank Name"),
    gender: field(raw, "Gender"),
    marital_status: field(raw, "Marital Status"),
    birthday: parseUsDate(raw["Birthday"]),
    id_no: field(raw, "ID No."),
    issued_date: parseUsDate(raw["Issued Date"]),
    passport_no: field(raw, "Passport No."),
    nationality: field(raw, "Nationality"),
    permanent_address: field(raw, "Permanent Address"),
    temporary_address: field(raw, "Temporary Address"),
    emergency_contact: field(raw, "Emergency Contact"),
    relationship: field(raw, "Relationship"),
    contact_phone_no: contactPhone,
    contact_address: field(raw, "Contact Address"),
    health_insurance: field(raw, "Health Insurance"),
    is_archived: raw["Archived"]?.trim().toLowerCase() === "archived",
  };
  return { mapped, errors, warnings };
}

export function EmployeeImportPage() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

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
          setRows(null);
          return;
        }
        setRows(results.data.map(mapRow));
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
