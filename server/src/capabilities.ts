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

export const ACCESS_LEVELS = ["team_member", "team_lead", "head_of_department", "owner"] as const;
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
  team_lead: ["profile.create", "profile.edit", "profile.archive", "jobdescription.create", "jobdescription.edit", "jobdescription.archive"],
  head_of_department: ["careerrole.create", "careerrole.edit", "careerrole.archive"],
  owner: ["user.admin"],
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
