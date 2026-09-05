import type { CareerMapRole } from "./types";
import { CAREER_RANK_ORDER } from "./types";

const RANK_INDEX = new Map(CAREER_RANK_ORDER.map((rank, i) => [rank, i]));

// Division alphabetically, then within a division: function (nulls last —
// those are usually division-level roles like "Head of Sales" rather than
// a specific function), then rank progression (Core -> Divisional), then
// role name. The API only guarantees `sort_order, role_name` (creation
// order), which doesn't group naturally at all — this is what actually
// makes a long division easy to scan.
function compareRoles(a: CareerMapRole, b: CareerMapRole): number {
  const divisionCmp = a.division.localeCompare(b.division);
  if (divisionCmp !== 0) return divisionCmp;
  if (a.function !== b.function) {
    if (!a.function) return 1;
    if (!b.function) return -1;
    const functionCmp = a.function.localeCompare(b.function);
    if (functionCmp !== 0) return functionCmp;
  }
  const rankCmp = (RANK_INDEX.get(a.rank) ?? 0) - (RANK_INDEX.get(b.rank) ?? 0);
  if (rankCmp !== 0) return rankCmp;
  return a.role_name.localeCompare(b.role_name);
}

export function groupByDivision(roles: CareerMapRole[]): [string, CareerMapRole[]][] {
  const sorted = [...roles].sort(compareRoles);
  const groups = new Map<string, CareerMapRole[]>();
  for (const role of sorted) {
    const group = groups.get(role.division);
    if (group) group.push(role);
    else groups.set(role.division, [role]);
  }
  return Array.from(groups.entries());
}

// For Career Map Role <select> pickers specifically: a native <select> has
// no true nested optgroups, so this flattens Division+Function into
// adjacent single-level groups labeled "Division — Function" (or just
// Division, for the function-less division-level roles) — the closest
// equivalent to two-level grouping, and still sorted so every group for one
// division sits together.
export function groupByDivisionAndFunction(roles: CareerMapRole[]): [string, CareerMapRole[]][] {
  const sorted = [...roles].sort(compareRoles);
  const groups = new Map<string, CareerMapRole[]>();
  for (const role of sorted) {
    const key = role.function ? `${role.division} — ${role.function}` : role.division;
    const group = groups.get(key);
    if (group) group.push(role);
    else groups.set(key, [role]);
  }
  return Array.from(groups.entries());
}
