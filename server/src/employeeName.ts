// Shared between routes/employees.ts (employee-code initials) and
// routes/users.ts (deriving a user's display name from their linked
// employee record on account creation) — one diacritics-stripping
// implementation instead of two copies that could drift apart.
//
// Vietnamese names carry diacritics (Ư, Đ, ...) that don't belong in a
// short, universally-typeable code, so the initial is taken from the
// diacritic-stripped form. Đ doesn't decompose under NFD, hence the
// explicit replace.
export function stripDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

// Mirrors web/src/lib/vietnamese.ts's employeeDisplayName exactly: [Last
// Name] [Middle Name] [First Name] ([English Name], if any) — the standard
// Vietnamese name order, Last/Middle/First shown unaccented, English name
// appended in parentheses rather than leading. Same reasoning as there,
// just needed server-side too now that a user account's name is derived
// from the linked employee rather than typed by whoever creates the
// account (see routes/users.ts).
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
