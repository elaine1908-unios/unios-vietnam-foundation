// Mirrors server/src/capabilities.ts (single source of truth for what each
// level maps to — the client never keeps a copy of that mapping, see the
// `capabilities` field on User below).
export const ACCESS_LEVELS = ["team_member", "team_lead", "head_of_department", "owner"] as const;
export type AccessLevel = (typeof ACCESS_LEVELS)[number];

export const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  team_member: "Team Member",
  team_lead: "Team Lead",
  head_of_department: "Head of Department",
  owner: "Owner",
};

export type Capability =
  | "profile.view"
  | "profile.create"
  | "profile.edit"
  | "profile.archive"
  | "careermap.view"
  | "careerrole.create"
  | "careerrole.edit"
  | "careerrole.archive"
  | "jobdescription.view"
  | "jobdescription.create"
  | "jobdescription.edit"
  | "jobdescription.archive"
  | "user.admin"
  | "employee.view"
  | "employee.create"
  | "employee.edit"
  | "employee.archive"
  | "employee.export";

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
  access_level: AccessLevel;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  // Effective capability list for this user's access_level, computed
  // server-side (see toPublicUser in server/src/types.ts) — drives
  // navigation and route-gating on the client, with nothing to keep in sync.
  capabilities: Capability[];
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

// Employee Master — per-employee HR record, distinct from ProfileSummary/
// ProfileDetail (which are per-ROLE, not per-person). Owner-only.
// Minimal shape of another employee, as referenced by report_to_employee —
// just enough to render a name and link to their record.
export interface EmployeeRef {
  id: string;
  employee_code: string | null;
  last_name: string;
  middle_name: string | null;
  first_name: string;
  english_name: string | null;
}

export interface EmployeeSummary {
  id: string;
  // Human-facing identifier (e.g. "UV-0001") — auto-assigned by the server,
  // never editable. Distinct from `id`, which is only ever used internally
  // (URLs, foreign keys).
  employee_code: string | null;
  last_name: string;
  middle_name: string | null;
  first_name: string;
  english_name: string | null;
  department: string | null;
  rank: string | null;
  office_location: string | null;
  report_to_employee: EmployeeRef | null;
  is_archived: boolean;
  is_offshore: boolean;
  birthday: string | null;
  commencement_date: string | null;
  contract_end_date: string | null;
}

export interface EmployeeDetail {
  id: string;
  employee_code: string | null;
  work_email: string | null;
  last_name: string;
  middle_name: string | null;
  first_name: string;
  english_name: string | null;
  department: string | null;
  position: string | null;
  rank: string | null;
  office_location: string | null;
  commencement_date: string | null;
  is_offshore: boolean;
  phone_no: string | null;
  personal_tax_no: string | null;
  bank_account_no: string | null;
  bank_name: string | null;
  is_archived: boolean;
  gender: string | null;
  marital_status: string | null;
  birthday: string | null;
  id_no: string | null;
  issued_date: string | null;
  passport_no: string | null;
  nationality: string | null;
  permanent_address: string | null;
  temporary_address: string | null;
  emergency_contact: string | null;
  relationship: string | null;
  contact_phone_no: string | null;
  health_insurance: string | null;
  contract_type: string | null;
  contract_length: string | null;
  contract_no: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  // Department/Position/Rank are set only by picking a Career Map role
  // (dropdown, not free text) — this is the traceability link, same pattern
  // as ProfileDetail.career_map_role_id: department/position/rank are saved,
  // independent snapshots that don't retroactively change if the role is
  // later renamed on the Career Map.
  career_map_role_id: string | null;
  career_map_role: CareerMapRole | null;
  // Who this employee reports to — a link to another employee row (dropdown
  // only, not free text), same reasoning as career_map_role_id above.
  report_to_employee_id: string | null;
  report_to_employee: EmployeeRef | null;
  created_at: string;
  updated_at: string;
}

export type EmployeeInput = Omit<
  EmployeeDetail,
  "id" | "employee_code" | "is_archived" | "created_at" | "updated_at" | "career_map_role" | "report_to_employee"
>;

export interface AuditLogEntry {
  id: string;
  entity_type?: string;
  entity_id?: string;
  action: string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
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
export type EmploymentType = "full_time" | "part_time";

export interface JobDescriptionSummary {
  id: string;
  location: string;
  job_title: string;
  division: string | null;
  function: string | null;
  is_archived: boolean;
  is_now_hiring: boolean;
  employment_type: EmploymentType;
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
  employment_type: EmploymentType;
  // Only meaningful for employment_type === "part_time" — full_time always
  // uses the fixed benefits boilerplate instead (see JD_COPY.benefits).
  custom_benefits: string | null;
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
