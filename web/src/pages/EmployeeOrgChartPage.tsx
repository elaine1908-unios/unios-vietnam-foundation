import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeSummary } from "../lib/types";
import { CAREER_RANK_LABELS, CAREER_RANK_ORDER, rankBadge } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";
import { OffshoreIcon } from "../components/OffshoreIcon";

interface OrgNode extends EmployeeSummary {
  children: OrgNode[];
}

// Built entirely from the same Report To links Employee Master already
// shows — no separate endpoint. A node whose manager isn't in the current
// (on-going, scope-filtered) result set becomes a root of its own, same as
// one with no manager at all — covers both "top of the company" and "my
// manager isn't visible to me" for a scoped Team Lead/Head of Department.
function buildReportToTree(employees: EmployeeSummary[]): OrgNode[] {
  const byId = new Map<string, OrgNode>();
  for (const e of employees) byId.set(e.id, { ...e, children: [] });
  const roots: OrgNode[] = [];
  for (const e of employees) {
    const node = byId.get(e.id)!;
    const manager = e.report_to_employee ? byId.get(e.report_to_employee.id) : undefined;
    if (manager) manager.children.push(node);
    else roots.push(node);
  }
  const byName = (a: OrgNode, b: OrgNode) => employeeDisplayName(a).localeCompare(employeeDisplayName(b));
  function sortRec(nodes: OrgNode[]) {
    nodes.sort(byName);
    for (const n of nodes) sortRec(n.children);
  }
  sortRec(roots);
  return roots;
}

function EmployeeCard({ node }: { node: OrgNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children.length > 0;
  return (
    <li>
      <div className="card !p-3 w-56 relative">
        <Link
          to={`/employees/${node.id}`}
          className="text-accent font-medium hover:underline inline-flex items-center gap-1.5 text-sm"
        >
          {employeeDisplayName(node)}
          {node.is_offshore && <OffshoreIcon className="w-3.5 h-3.5 shrink-0" />}
        </Link>
        <p className="text-xs text-ink-muted mt-0.5">
          {node.department || "—"}
          {node.rank ? ` · ${rankBadge(node.rank)}` : ""}
        </p>
        {hasChildren && (
          <button
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-border bg-surface text-xs text-ink-muted w-6 h-6 hover:bg-surface-2"
            onClick={() => setCollapsed((c) => !c)}
            title={collapsed ? `Show ${node.children.length} direct report(s)` : "Collapse"}
            type="button"
          >
            {collapsed ? node.children.length : "–"}
          </button>
        )}
      </div>
      {hasChildren && !collapsed && (
        <ul>
          {node.children.map((child) => (
            <EmployeeCard key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

function ReportToChart({ employees }: { employees: EmployeeSummary[] }) {
  const roots = useMemo(() => buildReportToTree(employees), [employees]);
  if (roots.length === 0) return <p className="text-sm text-ink-muted">No on-going employees to show.</p>;
  return (
    <div className="overflow-x-auto pb-6">
      <ul className="org-tree">
        {roots.map((root) => (
          <EmployeeCard key={root.id} node={root} />
        ))}
      </ul>
    </div>
  );
}

// Highest rank first — a Function's people are grouped into these tiers and
// stacked so Leadership sits above Specialists and Core, matching the
// Career Map's own progression read top to bottom instead of bottom to top.
const RANK_DISPLAY_ORDER = [...CAREER_RANK_ORDER].reverse().map((k) => CAREER_RANK_LABELS[k]);
const NO_RANK = "No rank set";

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    const list = map.get(k);
    if (list) list.push(item);
    else map.set(k, [item]);
  }
  return map;
}

function sortedKeys(map: Map<string, unknown>, fallbackLast: string): string[] {
  return [...map.keys()].sort((a, b) => {
    if (a === fallbackLast) return 1;
    if (b === fallbackLast) return -1;
    return a.localeCompare(b);
  });
}

function EmployeeChip({ e }: { e: EmployeeSummary }) {
  return (
    <Link
      to={`/employees/${e.id}`}
      className="card !p-2.5 w-48 text-accent font-medium hover:underline inline-flex items-center gap-1.5 text-sm"
    >
      {employeeDisplayName(e)}
      {e.is_offshore && <OffshoreIcon className="w-3.5 h-3.5 shrink-0" />}
    </Link>
  );
}

function DeptFunctionChart({ employees }: { employees: EmployeeSummary[] }) {
  const [collapsedDepts, setCollapsedDepts] = useState<Set<string>>(new Set());
  const byDept = useMemo(() => groupBy(employees, (e) => e.department || "No department set"), [employees]);
  const deptKeys = sortedKeys(byDept, "No department set");

  function toggleDept(dept: string) {
    setCollapsedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(dept)) next.delete(dept);
      else next.add(dept);
      return next;
    });
  }

  if (deptKeys.length === 0) return <p className="text-sm text-ink-muted">No on-going employees to show.</p>;

  return (
    <div className="flex flex-col gap-6">
      {deptKeys.map((dept) => {
        const deptEmployees = byDept.get(dept)!;
        const collapsed = collapsedDepts.has(dept);
        const byFunction = groupBy(deptEmployees, (e) => e.function || "No function set");
        const functionKeys = sortedKeys(byFunction, "No function set");
        return (
          <div key={dept}>
            <button
              className="w-full flex items-center justify-between bg-accent-2 text-white text-sm font-display font-semibold px-3 py-2 rounded-t-md"
              onClick={() => toggleDept(dept)}
              type="button"
            >
              <span>{dept}</span>
              <span className="text-xs font-normal text-white/70">
                {deptEmployees.length} {deptEmployees.length === 1 ? "person" : "people"} {collapsed ? "▸" : "▾"}
              </span>
            </button>
            {!collapsed && (
              <div className="border border-t-0 border-border rounded-b-md p-4 flex flex-col gap-5">
                {functionKeys.map((fn) => {
                  const fnEmployees = byFunction.get(fn)!;
                  const byRank = groupBy(fnEmployees, (e) => e.rank || NO_RANK);
                  const rankKeys = RANK_DISPLAY_ORDER.filter((r) => byRank.has(r)).concat(
                    byRank.has(NO_RANK) ? [NO_RANK] : [],
                  );
                  return (
                    <div key={fn}>
                      <h3 className="text-sm font-display font-semibold text-ink-muted mb-2">{fn}</h3>
                      <div className="flex flex-col gap-3 pl-3 border-l-2 border-border">
                        {rankKeys.map((rank) => (
                          <div key={rank}>
                            <p className="text-xs text-ink-faint mb-1.5">
                              {rank === NO_RANK ? rank : rankBadge(rank)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {byRank
                                .get(rank)!
                                .sort((a, b) => employeeDisplayName(a).localeCompare(employeeDisplayName(b)))
                                .map((e) => (
                                  <EmployeeChip key={e.id} e={e} />
                                ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function EmployeeOrgChartPage() {
  const [view, setView] = useState<"report-to" | "department">("report-to");
  const { data, isLoading, error } = useQuery({
    queryKey: ["employees", "org-chart"],
    queryFn: () => api.get<EmployeeSummary[]>("/employees"),
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error || !data) return <p className="text-sm text-red-600">Couldn't load employee data.</p>;

  return (
    <div>
      <Link to="/employees" className="text-sm text-accent hover:underline">
        ← Employee Master
      </Link>
      <div className="flex items-center justify-between mt-1 mb-4 gap-3">
        <h1 className="font-display font-bold text-xl">Org Chart</h1>
        <div className="flex gap-2">
          <button
            className={`rounded-md border px-3 py-1.5 text-sm ${
              view === "report-to" ? "border-accent bg-accent-soft text-accent font-medium" : "border-border text-ink-muted hover:bg-surface-2"
            }`}
            onClick={() => setView("report-to")}
            type="button"
          >
            Report To
          </button>
          <button
            className={`rounded-md border px-3 py-1.5 text-sm ${
              view === "department" ? "border-accent bg-accent-soft text-accent font-medium" : "border-border text-ink-muted hover:bg-surface-2"
            }`}
            onClick={() => setView("department")}
            type="button"
          >
            Department / Function / Rank
          </button>
        </div>
      </div>
      {view === "report-to" ? <ReportToChart employees={data} /> : <DeptFunctionChart employees={data} />}
    </div>
  );
}
