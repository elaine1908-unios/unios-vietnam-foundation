import { useState } from "react";
import type { ChangeEvent } from "react";
import Papa from "papaparse";
import { Link } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import type { ImportResult, ImportRowError, RequestType } from "../lib/types";
import { REQUEST_TYPE_LABELS } from "../lib/types";

const TABS: RequestType[] = ["AL", "OT", "BT"];

const COLUMNS: Record<RequestType, string[]> = {
  AL: ["Work Email", "Leave Type", "Start Date", "Return to Work Date", "Duration", "Reason"],
  OT: ["Work Email", "OT Date", "Start Time", "End Time", "Break Minutes", "Reason", "Project/Department", "Location"],
  BT: [
    "Work Email",
    "Destination",
    "Purpose",
    "Departure Date",
    "Return Date",
    "Project/Client",
    "Transportation Required",
    "Hotel Required",
    "Advance Payment Required",
    "Advance Amount",
    "Advance Currency",
    "Advance Notes",
    "Additional Notes",
  ],
};

// Shown as a second row in the downloaded template — a worked example
// beats a header-only file for showing the expected enum spellings
// (Leave Type, Duration, Location) and date/time formats.
const EXAMPLE_ROW: Record<RequestType, string[]> = {
  AL: ["jane.doe@unios.com", "Annual Leave", "2026-01-06", "2026-01-06", "Full Day", "New Year travel"],
  OT: ["jane.doe@unios.com", "2026-01-15", "18:00", "21:00", "0", "Release prep", "Engineering", "Office"],
  BT: [
    "jane.doe@unios.com",
    "Hanoi",
    "Client workshop",
    "2026-02-10",
    "2026-02-12",
    "Acme Corp",
    "Yes",
    "Yes",
    "No",
    "",
    "",
    "",
    "",
  ],
};

function downloadTemplate(type: RequestType) {
  const csv = [COLUMNS[type].join(","), EXAMPLE_ROW[type].join(",")].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type.toLowerCase()}-import-template.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImportRequestsPage() {
  const [type, setType] = useState<RequestType>("AL");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [rowErrors, setRowErrors] = useState<ImportRowError[]>([]);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState<number | null>(null);

  function resetFile() {
    setRows([]);
    setFileName(null);
    setParseError(null);
    setRowErrors([]);
    setSubmitError(null);
    setImportedCount(null);
  }

  function handleTypeChange(next: RequestType) {
    setType(next);
    resetFile();
  }

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resetFile();
    setFileName(file.name);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
      complete: (result) => {
        if (result.errors.length > 0) {
          setParseError(result.errors[0].message);
          return;
        }
        setRows(result.data);
      },
      error: (err) => setParseError(err.message),
    });
    e.target.value = "";
  }

  async function handleImport() {
    setImporting(true);
    setRowErrors([]);
    setSubmitError(null);
    setImportedCount(null);
    try {
      const result = await api.post<ImportResult>("/requests/import", { type, rows });
      setImportedCount(result.imported ?? 0);
      setRows([]);
      setFileName(null);
    } catch (err) {
      const data = err instanceof ApiError ? (err.data as { error?: string; rowErrors?: ImportRowError[] } | undefined) : undefined;
      if (data?.rowErrors) {
        setRowErrors(data.rowErrors);
        setSubmitError(data.error ?? "Some rows couldn't be imported.");
      } else {
        setSubmitError(err instanceof ApiError ? err.message : "Something went wrong.");
      }
    } finally {
      setImporting(false);
    }
  }

  const columns = COLUMNS[type];

  return (
    <div className="max-w-5xl">
      <Link to="/requests/manage" className="text-sm text-accent hover:underline">
        ← Manage AL, OT & BT
      </Link>
      <h1 className="font-display font-bold text-xl mt-1 mb-1">Import Historical Requests</h1>
      <p className="text-sm text-ink-muted mb-4">
        Bulk-load already-decided AL, OT, or BT requests — for migrating history from a previous system. Imported
        rows are saved directly as <strong>Approved</strong>, with no approval step and no entitlement check.
      </p>

      <div className="flex items-center gap-2 mb-4">
        {TABS.map((t) => (
          <button
            key={t}
            className={`rounded-md border px-3 py-1.5 text-sm ${
              type === t
                ? "border-accent bg-accent-soft text-accent font-medium"
                : "border-border text-ink-muted hover:bg-surface-2"
            }`}
            onClick={() => handleTypeChange(t)}
            type="button"
          >
            {REQUEST_TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      <div className="card !p-4 flex flex-col gap-3 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button
            className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-2"
            onClick={() => downloadTemplate(type)}
            type="button"
          >
            Download {REQUEST_TYPE_LABELS[type]} Template
          </button>
          <label className="rounded-md border border-border px-3 py-1.5 text-sm text-ink-muted hover:bg-surface-2 cursor-pointer">
            Choose CSV File
            <input type="file" accept=".csv" className="hidden" onChange={handleFile} />
          </label>
          {fileName && <span className="text-sm text-ink-muted">{fileName}</span>}
        </div>
        <p className="text-xs text-ink-faint">
          Required columns: {columns.join(", ")}. Work Email must match an existing employee record.
        </p>
      </div>

      {parseError && <p className="text-sm text-red-600 mb-4">{parseError}</p>}

      {rows.length > 0 && (
        <>
          <div className="card !p-0 overflow-hidden mb-4">
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface-2">
                  <tr className="border-b border-border text-left text-ink-muted">
                    <th className="px-2 py-1.5 font-medium">#</th>
                    {columns.map((c) => (
                      <th key={c} className="px-2 py-1.5 font-medium whitespace-nowrap">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const rowError = rowErrors.find((e) => e.row === i + 1);
                    return (
                      <tr
                        key={i}
                        className={`border-b border-border last:border-0 ${rowError ? "bg-status-critical-soft" : ""}`}
                      >
                        <td className="px-2 py-1.5 text-ink-faint">{i + 1}</td>
                        {columns.map((c) => (
                          <td key={c} className="px-2 py-1.5 whitespace-nowrap">
                            {row[c] || <span className="text-ink-faint">—</span>}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {rowErrors.length > 0 && (
            <div className="card !p-4 mb-4 border-l-4 border-l-status-critical">
              <h2 className="font-display font-semibold mb-2 text-status-critical">
                {submitError ?? "Some rows couldn't be imported."}
              </h2>
              <ul className="text-sm flex flex-col gap-1">
                {rowErrors.map((e) => (
                  <li key={e.row}>
                    Row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {submitError && rowErrors.length === 0 && <p className="text-sm text-red-600 mb-4">{submitError}</p>}

          <button className="btn-primary" onClick={handleImport} disabled={importing} type="button">
            {importing ? "Importing…" : `Import ${rows.length} Row${rows.length === 1 ? "" : "s"}`}
          </button>
        </>
      )}

      {importedCount != null && (
        <p className="text-sm text-status-positive mt-4">
          Imported {importedCount} request{importedCount === 1 ? "" : "s"}.
        </p>
      )}
    </div>
  );
}
