import Papa from "papaparse";
import type { EmployeeDetail } from "./types";
import { employeeDisplayName } from "./vietnamese";

// Column order/headers mirror the CSV import mapping exactly (see
// EmployeeImportPage.tsx) so an export can be edited and fed straight back
// in via "Update existing employees only" — Rank and Report To are the two
// exceptions, included for reference even though neither is part of the
// import mapping (Rank comes from the Career Map link; Report To is set
// manually — see the same reasoning in routes/employees.ts).
const EXPORT_COLUMNS: { header: string; get: (e: EmployeeDetail) => string }[] = [
  { header: "Employee ID", get: (e) => e.employee_code ?? "" },
  { header: "Work Email", get: (e) => e.work_email ?? "" },
  { header: "Last Name", get: (e) => e.last_name ?? "" },
  { header: "Middle Name", get: (e) => e.middle_name ?? "" },
  { header: "First Name", get: (e) => e.first_name ?? "" },
  { header: "English Name", get: (e) => e.english_name ?? "" },
  { header: "Department", get: (e) => e.department ?? "" },
  { header: "Position", get: (e) => e.position ?? "" },
  { header: "Rank", get: (e) => e.rank ?? "" },
  { header: "Office Location", get: (e) => e.office_location ?? "" },
  { header: "Commencement Date", get: (e) => e.commencement_date ?? "" },
  { header: "Off-shore", get: (e) => (e.is_offshore ? "Yes" : "") },
  { header: "Report To", get: (e) => (e.report_to_employee ? employeeDisplayName(e.report_to_employee) : "") },
  { header: "Phone No.", get: (e) => e.phone_no ?? "" },
  { header: "Personal Tax No.", get: (e) => e.personal_tax_no ?? "" },
  { header: "Bank Account No.", get: (e) => e.bank_account_no ?? "" },
  { header: "Bank Name", get: (e) => e.bank_name ?? "" },
  { header: "Gender", get: (e) => e.gender ?? "" },
  { header: "Marital Status", get: (e) => e.marital_status ?? "" },
  { header: "Birthday", get: (e) => e.birthday ?? "" },
  { header: "ID No.", get: (e) => e.id_no ?? "" },
  { header: "Issued Date", get: (e) => e.issued_date ?? "" },
  { header: "Passport No.", get: (e) => e.passport_no ?? "" },
  { header: "Nationality", get: (e) => e.nationality ?? "" },
  { header: "Permanent Address", get: (e) => e.permanent_address ?? "" },
  { header: "Temporary Address", get: (e) => e.temporary_address ?? "" },
  { header: "Emergency Contact", get: (e) => e.emergency_contact ?? "" },
  { header: "Relationship", get: (e) => e.relationship ?? "" },
  { header: "Contact Phone No.", get: (e) => e.contact_phone_no ?? "" },
  { header: "Health Insurance", get: (e) => e.health_insurance ?? "" },
  { header: "Contract Type", get: (e) => e.contract_type ?? "" },
  { header: "Contract Length", get: (e) => e.contract_length ?? "" },
  { header: "Contract No.", get: (e) => e.contract_no ?? "" },
  { header: "Contract Start Date", get: (e) => e.contract_start_date ?? "" },
  { header: "Contract End Date", get: (e) => e.contract_end_date ?? "" },
  { header: "Archived", get: (e) => (e.is_archived ? "Archived" : "") },
];

export function employeesToCsv(employees: EmployeeDetail[]): string {
  const rows = employees.map((e) => {
    const row: Record<string, string> = {};
    for (const col of EXPORT_COLUMNS) row[col.header] = col.get(e);
    return row;
  });
  return Papa.unparse(rows, { columns: EXPORT_COLUMNS.map((c) => c.header) });
}

// A plain <a download> click — works for a same-origin Blob URL, no server
// round trip needed since the CSV is already fully built client-side.
export function downloadCsv(filename: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
