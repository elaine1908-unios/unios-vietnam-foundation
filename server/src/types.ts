import type { AccessLevel, Capability } from "./capabilities.js";
import { capabilitiesFor } from "./capabilities.js";

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
  created_at: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  access_level: AccessLevel;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  // The effective capability list for this user's access_level — computed
  // here, once, server-side. The client drives navigation off this instead
  // of keeping its own copy of the access-level -> capability table, so the
  // two can never silently drift apart.
  capabilities: Capability[];
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    access_level: row.access_level,
    is_active: Boolean(row.is_active),
    must_change_password: Boolean(row.must_change_password),
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
