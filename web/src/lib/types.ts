export type UserRole = "team_lead" | "team_member";

export type CareerRankKey = "core" | "specialists" | "leadership" | "divisional";

export const CAREER_RANK_LABELS: Record<CareerRankKey, string> = {
  core: "Core (C)",
  specialists: "Specialists (S)",
  leadership: "Leadership & Senior Specialists (L)",
  divisional: "Divisional Leadership (D)",
};
export const CAREER_RANK_ORDER: CareerRankKey[] = ["core", "specialists", "leadership", "divisional"];

export interface CareerMapRole {
  id: string;
  division: string;
  function: string | null;
  rank: CareerRankKey;
  role_name: string;
  sort_order: number;
  is_archived: boolean;
  // Non-archived Job Profiles currently linked to this role. Present on
  // list/detail responses from the API; absent (undefined) is treated as 0.
  profile_count?: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  title: string | null;
  created_at: string;
}

export interface ProfileSummary {
  id: string;
  job_title: string;
  rank: string | null;
  division: string | null;
  function: string | null;
  location: string | null;
  last_updated: string | null;
  is_archived: boolean;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  changed_at: string;
  changed_by_name: string | null;
  changed_by_email: string | null;
}

export interface Responsibility {
  id?: string;
  main_function: string;
  responsibilities: string;
  success_criteria: string | null;
}
export interface Requirement {
  id?: string;
  requirement: string;
}
export interface Okr {
  id?: string;
  objective: string;
  key_results: string;
}
export type CompetencyLevel = "Basic" | "Intermediate" | "Advanced" | "Expert";
export interface Competency {
  id?: string;
  skill: string;
  level: CompetencyLevel | null;
  requirement: string | null;
}

export interface ProfileDetail {
  id: string;
  job_title: string;
  rank: string | null;
  division: string | null;
  function: string | null;
  location: string | null;
  last_updated: string | null;
  compensation: string | null;
  benefits: string | null;
  bonuses: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // The Career Map role this profile was created from, if any (null when
  // created via "Other — type manually"). career_map_role is the CURRENT
  // state of that role (may have been renamed/archived since) — this
  // profile's own job_title/rank/division/function are never auto-updated to
  // match, they're independent, saved values.
  career_map_role_id: string | null;
  career_map_role: CareerMapRole | null;
  responsibilities: Responsibility[];
  requirements: Requirement[];
  okrs: Okr[];
  competencies: Competency[];
}

export interface GrammarIssue {
  label: string;
  issue: string;
  suggestion: string;
}

export interface ProfileTranslation {
  content: {
    job_title: string;
    rank: string | null;
    division: string | null;
    function: string | null;
    location: string | null;
    compensation: string | null;
    benefits: string | null;
    bonuses: string | null;
    responsibilities: Responsibility[];
    requirements: Requirement[];
    okrs: Okr[];
    competencies: Competency[];
  };
  translated_at: string;
  stale: boolean;
}

export type ProfileInput = Pick<
  ProfileDetail,
  | "job_title"
  | "rank"
  | "division"
  | "function"
  | "location"
  | "last_updated"
  | "compensation"
  | "benefits"
  | "bonuses"
  | "career_map_role_id"
> & {
  responsibilities: Responsibility[];
  requirements: Requirement[];
  okrs: Okr[];
  competencies: Competency[];
};

// Job Descriptions are candidate-facing recruitment documents generated from
// a Job Profile + a Location. Their role content (title, responsibilities
// minus success criteria, requirements, competencies) is pulled LIVE from
// the linked profile — never stored on the JD itself.
export interface JobDescriptionSummary {
  id: string;
  location: string;
  job_title: string;
  division: string | null;
  function: string | null;
  is_archived: boolean;
  is_now_hiring: boolean;
  updated_at: string;
}

export interface JdResponsibility {
  main_function: string;
  responsibilities: string;
}
export interface JdRequirement {
  requirement: string;
}
export interface JdCompetency {
  skill: string;
  level: CompetencyLevel | null;
  requirement: string | null;
}

export interface JobDescriptionDetail {
  id: string;
  job_profile_id: string;
  location: string;
  job_title: string;
  division: string | null;
  function: string | null;
  is_archived: boolean;
  is_now_hiring: boolean;
  created_at: string;
  updated_at: string;
  responsibilities: JdResponsibility[];
  requirements: JdRequirement[];
  competencies: JdCompetency[];
}

// Shape returned by both /job-descriptions/:id/translation and
// /public/job-descriptions/:id/translation.
export interface JobDescriptionTranslation {
  job_title: string;
  location: string;
  responsibilities: JdResponsibility[];
  requirements: JdRequirement[];
  competencies: JdCompetency[];
}
