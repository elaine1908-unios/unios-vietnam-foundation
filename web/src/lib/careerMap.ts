import type { CareerMapRole } from "./types";

export function groupByDivision(roles: CareerMapRole[]): [string, CareerMapRole[]][] {
  const groups = new Map<string, CareerMapRole[]>();
  for (const role of roles) {
    const group = groups.get(role.division);
    if (group) group.push(role);
    else groups.set(role.division, [role]);
  }
  return Array.from(groups.entries());
}
