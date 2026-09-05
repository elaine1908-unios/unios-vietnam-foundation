// Preset option lists for Employee Master fields with a clean, closed set of
// values in the real HR data (see "Employee Information _ Thông tin nhân
// viên.csv") — shared between the manual New/Edit form and the CSV import
// preview so both present the same choices.
//
// Nationality and Relationship are deliberately NOT closed dropdowns here:
// both showed real, open-ended variation even in a 98-row sample (a Dutch
// and an Australian nationality; relationship terms mixing Vietnamese,
// English, and at least one typo), so forcing a fixed list would block
// legitimate future entries. Department/Position/Rank are handled
// separately via the Career Map link, not here.

// Vietnam's domestic prefix — pre-filled on the manual form since nearly
// every hire is a domestic number, and auto-added to whatever a CSV import
// brings in (see normalizePhone below) so both entry paths land on the same
// shape. Plain editable text either way: a foreign number (e.g. a Dutch or
// Australian hire) just gets typed/edited over it.
export const DEFAULT_PHONE_PREFIX = "(084) ";
export const PHONE_PLACEHOLDER = "(084) XXX XXX XXX";

// A CSV's phone column is typically just the bare local number (e.g. "0912
// 345 678", however it happened to be formatted) — this adds the same
// "(084) " prefix the manual form pre-fills, so imported and manually
// entered numbers end up in the same shape. Left untouched if it already
// looks like it carries a country code, so re-running normalization (or
// importing a file that already has it) never double-prefixes.
export function normalizePhone(value: string | null): string | null {
  if (!value) return value;
  if (/^\(?\+?084\)?/.test(value) || value.startsWith("+84")) return value;
  return `${DEFAULT_PHONE_PREFIX}${value}`;
}

export const OFFICE_LOCATIONS = [
  "Unios Chelsea (Hanoi)",
  "Unios HEC (HCMC)",
  "Unios Cityview (HCMC)",
  "Unios Warehouse (Tay Ninh)",
];

// Official bank code — full name list (supersedes the earlier CSV-observed
// subset), covering all major Vietnamese banks rather than just the ones
// that happened to appear in the initial 98-employee sample.
export const BANK_NAMES = [
  "ABB – ABBank",
  "ACB – ACB",
  "AGR – Agribank",
  "ANZ – ANZ Việt Nam",
  "BIDV – BIDV",
  "BVB – BaoVietBank",
  "CIMB – CIMB Việt Nam",
  "CTG – VietinBank",
  "EIB – Eximbank",
  "HDB – HDBank",
  "HLBVN – Hong Leong Bank Việt Nam",
  "HSBC – HSBC Việt Nam",
  "IVB – Indovina Bank",
  "KLB – Kienlongbank",
  "LPB – LPBank",
  "MB – MBBank",
  "MSB – MSB",
  "NAB – Nam A Bank",
  "NCB – NCB",
  "OCB – OCB",
  "PBVN – Public Bank Việt Nam",
  "PGB – PGBank",
  "SCB – Standard Chartered VN",
  "SEAB – SeABank",
  "SGB – Saigonbank",
  "SHB – SHB",
  "SHBVN – Shinhan Bank Việt Nam",
  "STB – Sacombank",
  "TCB – Techcombank",
  "TPB – TPBank",
  "UOB – UOB Việt Nam",
  "VAB – VietABank",
  "VBB – VietBank",
  "VCB – Vietcombank",
  "VIB – VIB",
  "VPB – VPBank",
  "VRB – VietNga",
  "WOO – Woori Bank Việt Nam",
];

export const GENDERS = ["Nam / Male", "Nữ / Female"];

export const MARITAL_STATUSES = [
  "Đã kết hôn / Married",
  "Chưa kết hôn / Single",
  "Đã ly dị / Divorced",
  "In a relationship",
];

// Registration status for social/health insurance — not a provider or plan
// name, despite the field's generic-sounding label.
export const HEALTH_INSURANCE_STATUSES = ["Đã đăng ký", "Chưa đến hạn đăng ký"];

export const CONTRACT_TYPES = ["Official", "Part-time", "Probation"];

// Length of Contract depends on Contract Type: Probation is always a short,
// fixed trial period, while Official/Part-time share the same longer-term
// options (an indefinite contract, or a fixed 1- or 3-year term).
export const CONTRACT_LENGTH_OPTIONS: Record<string, string[]> = {
  Official: ["Indefinite", "3-year", "1-year"],
  "Part-time": ["Indefinite", "3-year", "1-year"],
  Probation: ["2-month", "6-month"],
};
