import type { AccessLevel, Capability } from "./capabilities.js";
import { capabilitiesFor } from "./capabilities.js";
import { db } from "./db.js";
import { employeeDisplayName } from "./employeeName.js";

export type CareerRankKey = "core" | "specialists" | "leadership" | "divisional";

// Display labels for the Career Map's four rank tiers — see
// migrations/0002_career_map.sql for where the tier definitions come from.
export const CAREER_RANK_LABELS: Record<CareerRankKey, string> = {
  core: "Core (C)",
  specialists: "Specialists (S)",
  leadership: "Leadership & Senior Specialists (L)",
  divisional: "Divisional Leadership (D)",
};

export interface UserRow {
  id: string;
  name: string;
  email: string;
  // `role`/`title` are legacy columns, superseded by access_level — kept in
  // the row shape only because SELECT * still returns them; not read.
  role: string;
  title: string | null;
  access_level: AccessLevel;
  is_active: number;
  must_change_password: number;
  password_hash: string | null;
  totp_secret: string | null;
  totp_enabled: number;
  totp_enabled_at: string | null;
  must_setup_2fa: number;
  created_at: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  access_level: AccessLevel;
  is_active: boolean;
  must_change_password: boolean;
  has_2fa: boolean;
  // True when this account must set up 2FA before it can do anything else
  // (new account, an admin-reset password, or the one-time company-wide
  // rollout — see migrations/0028_force_2fa_setup.sql) and hasn't yet.
  // Ignored once has_2fa is true even if the column itself is still 1 —
  // see force2faSetupGate.ts and RequireAuth.tsx, both of which gate on
  // `must_setup_2fa && !has_2fa` rather than the raw column.
  must_setup_2fa: boolean;
  created_at: string;
  // The effective capability list for this user's access_level — computed
  // here, once, server-side. The client drives navigation off this instead
  // of keeping its own copy of the access-level -> capability table, so the
  // two can never silently drift apart.
  capabilities: Capability[];
}

// A user's display name is always their linked Employee Master record's name
// (matched by Work Email), never a value they typed themselves — this keeps
// it permanently in sync with Employee Master instead of the old model where
// it drifted until someone remembered to click "Sync names". Falls back to
// the stored `users.name` only for an account with no matching employee row
// (predates Employee Master, or the email was never onboarded there).
export function computedNameFor(email: string): string | null {
  const employee = db
    .prepare("SELECT english_name, first_name, middle_name, last_name FROM employees WHERE LOWER(work_email) = ?")
    .get(email.toLowerCase()) as
    | { english_name: string | null; first_name: string; middle_name: string | null; last_name: string }
    | undefined;
  return employee ? employeeDisplayName(employee) : null;
}

// Same "linked Employee Master name wins" rule as a user's own display name
// above, applied to "who did this" attribution in every audit trail (Job
// Profile history, Code of Conduct version history, AL/OT/BT Approval
// History, the company-wide Audit Log) instead of just account info.
// Callers select `changed_by_name`/`changed_by_email` from `users` via a
// LEFT JOIN (changed_by can be null for a system action, hence the guard)
// and map each row through this afterward.
export function resolvedChangedByName<T extends { changed_by_name: string | null; changed_by_email?: string | null }>(
  row: T,
): T {
  if (!row.changed_by_email) return row;
  return { ...row, changed_by_name: computedNameFor(row.changed_by_email) ?? row.changed_by_name };
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: computedNameFor(row.email) ?? row.name,
    email: row.email,
    access_level: row.access_level,
    is_active: Boolean(row.is_active),
    must_change_password: Boolean(row.must_change_password),
    has_2fa: Boolean(row.totp_enabled),
    must_setup_2fa: Boolean(row.must_setup_2fa),
    created_at: row.created_at,
    capabilities: capabilitiesFor(row.access_level),
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
