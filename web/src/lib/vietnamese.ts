// Mirrors stripDiacritics() in server/src/routes/employees.ts (used there
// for Employee ID initials) — a client-side copy for display purposes,
// since the DOM has no equivalent built in. Đ doesn't decompose under NFD,
// hence the explicit replace.
export function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// The employee's display name is always [English Name (if any)] [First
// Name] [Last Name] — Middle Name dropped, Western first/last order instead
// of the Vietnamese last-first convention. First/Last are shown in
// unaccented form (a quick, universally-typeable reference), regardless of
// whether the underlying record has diacritics from manual entry or a CSV
// import — the stored value itself keeps its diacritics untouched.
export function employeeDisplayName(e: {
  english_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
}): string {
  return [e.english_name, stripDiacritics(e.first_name ?? ""), stripDiacritics(e.last_name ?? "")]
    .filter(Boolean)
    .join(" ");
}
