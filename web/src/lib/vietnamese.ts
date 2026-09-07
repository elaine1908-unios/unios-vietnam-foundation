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

// The employee's display name is always [Last Name] [Middle Name] [First
// Name] ([English Name], if any) — the standard Vietnamese name order,
// with the English name (when set) appended in parentheses rather than
// leading. Last/Middle/First are shown in unaccented form (a quick,
// universally-typeable reference), regardless of whether the underlying
// record has diacritics from manual entry or a CSV import — the stored
// value itself keeps its diacritics untouched.
export function employeeDisplayName(e: {
  english_name?: string | null;
  first_name?: string | null;
  middle_name?: string | null;
  last_name?: string | null;
}): string {
  const vietnameseName = [e.last_name, e.middle_name, e.first_name]
    .map((p) => stripDiacritics(p ?? ""))
    .filter(Boolean)
    .join(" ");
  if (!e.english_name) return vietnameseName;
  return vietnameseName ? `${vietnameseName} (${e.english_name})` : e.english_name;
}
