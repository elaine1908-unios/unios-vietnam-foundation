export type UserRole = "team_lead" | "team_member";

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
  role: UserRole;
  is_active: number;
  password_hash: string | null;
  title: string | null;
  created_at: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  title: string | null;
  created_at: string;
}

export function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    is_active: Boolean(row.is_active),
    title: row.title,
    created_at: row.created_at,
  };
}

declare global {
  namespace Express {
    interface Request {
      user?: PublicUser;
    }
  }
}
