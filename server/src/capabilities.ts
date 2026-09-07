// Single source of truth for the access-level -> capability mapping. The
// client never keeps its own copy of this table (see toPublicUser in
// types.ts, which ships the effective capability list to the client on
// login/`/auth/me`) — that's what keeps the server's enforcement and the
// client's navigation from ever drifting apart, instead of relying on two
// hand-maintained copies staying in sync.
//
// "Access level" (this file) is what a user is allowed to DO in the app.
// It is unrelated to "career role" (career_map_roles) — a job position like
// "Senior Lighting Designer" that's just business content.

export const ACCESS_LEVELS = ["team_member", "team_lead", "head_of_department", "admin", "owner"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export function isAccessLevel(value: unknown): value is AccessLevel {
  return typeof value === "string" && (ACCESS_LEVELS as readonly string[]).includes(value);
}

export const CAPABILITIES = [
  "profile.view",
  "profile.create",
  "profile.edit",
  "profile.archive",
  "careermap.view",
  "careerrole.create",
  "careerrole.edit",
  "careerrole.archive",
  // Job Descriptions aren't covered by the original spec (career map +
  // profiles only) — they're candidate-facing documents generated from a
  // Job Profile, so they're extended here at the same tier as profiles
  // rather than left ungated.
  "jobdescription.view",
  "jobdescription.create",
  "jobdescription.edit",
  "jobdescription.archive",
  "user.admin",
  // Employee Master — per-employee HR records (tax/bank/ID/passport
  // numbers, addresses, health insurance). Owner sees every employee with
  // every field; Team Lead/Head of Department also hold this capability
  // but the server further restricts what it returns to them (their own
  // reporting chain only, sensitive fields redacted) — see
  // employeeScopeFor() in routes/employees.ts. This capability alone only
  // means "can reach Employee Master at all", not "sees everything".
  "employee.view",
  "employee.create",
  "employee.edit",
  "employee.archive",
  // Distinct from employee.view — exporting hands out the same sensitive
  // data as a file, not just a page view, so it's tracked as its own
  // capability even though today's only tiers granting it (admin, owner)
  // also grant employee.view anyway.
  "employee.export",
  // The Employee Master "Danger Zone" — a genuine, unrecoverable hard
  // delete of every employee record. Deliberately its own capability,
  // separate from employee.archive, so Admin ("same as Owner, minus the
  // delete zone" — see ADDED_BY_LEVEL below) can do everything else Owner
  // can without holding this one.
  "employee.deleteAll",
] as const;
export type Capability = (typeof CAPABILITIES)[number];

// Built cumulatively, in level order — each level's array is the previous
// level's array plus its own additions, so there's exactly one place that
// says what each level adds, and no level can accidentally end up missing a
// capability a lower level has.
const ADDED_BY_LEVEL: Record<AccessLevel, Capability[]> = {
  // jobdescription.view sits here, not under team_lead — Job Descriptions
  // are read-only visible to every level, same as Job Profiles, matching
  // this app's existing "Team Member: view/download Job Descriptions" access
  // (see README) predating this spec.
  team_member: ["profile.view", "careermap.view", "jobdescription.view"],
  // employee.view here (not team_member) — cumulative, so head_of_department
  // and owner both get it too. Scoped to "my reporting chain" for
  // team_lead/head_of_department; see employeeScopeFor() in
  // routes/employees.ts for what that actually restricts.
  team_lead: [
    "profile.create",
    "profile.edit",
    "profile.archive",
    "jobdescription.create",
    "jobdescription.edit",
    "jobdescription.archive",
    "employee.view",
  ],
  head_of_department: ["careerrole.create", "careerrole.edit", "careerrole.archive"],
  // employee.view isn't re-listed here — already inherited from team_lead
  // above, cumulatively. Admin holds everything Owner does except the
  // Danger Zone (employee.deleteAll, added only at owner below) — "same as
  // Owner but no delete zone" per the access-level spec.
  admin: ["user.admin", "employee.create", "employee.edit", "employee.archive", "employee.export"],
  owner: ["employee.deleteAll"],
};

const CAPS_BY_LEVEL: Record<AccessLevel, Capability[]> = (() => {
  const result = {} as Record<AccessLevel, Capability[]>;
  let running: Capability[] = [];
  for (const level of ACCESS_LEVELS) {
    running = [...running, ...ADDED_BY_LEVEL[level]];
    result[level] = running;
  }
  return result;
})();

export function capabilitiesFor(level: AccessLevel): Capability[] {
  return CAPS_BY_LEVEL[level];
}

export function hasCapability(level: AccessLevel, cap: Capability): boolean {
  return CAPS_BY_LEVEL[level].includes(cap);
}
