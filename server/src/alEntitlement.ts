// Annual Leave entitlement, computed from tenure rather than a manually-set
// flat number (see migrations/0027_computed_al_entitlement.sql, which drops
// the column this replaces). Shared between routes/employees.ts (Employee
// Master's read-only display) and routes/requests.ts (the AL balance check
// on submit and the self-service balance endpoint), so both can never
// disagree about what an employee's entitlement is.
//
// The rule (as specified, not extrapolated further):
// - Under 12 months of tenure: 1 day per completed month worked.
// - 12 months up to 5 years: a flat 12 days.
// - 5 years or more: a flat 13 days.
// This app doesn't track accrual/carry-over beyond this flat annual
// amount — same simplification the column it replaces already made.
export function computeAlEntitlementDays(commencementDate: string | null, asOf: Date = new Date()): number {
  // Unknown tenure — same default the manual field's schema column used.
  if (!commencementDate) return 12;
  const [y, m, d] = commencementDate.split("-").map(Number);
  const start = new Date(y, m - 1, d);
  if (start > asOf) return 12; // future-dated commencement shouldn't happen; safe fallback
  let months = (asOf.getFullYear() - start.getFullYear()) * 12 + (asOf.getMonth() - start.getMonth());
  if (asOf.getDate() < start.getDate()) months -= 1;
  months = Math.max(0, months);
  if (months >= 60) return 13;
  if (months >= 12) return 12;
  return months;
}
