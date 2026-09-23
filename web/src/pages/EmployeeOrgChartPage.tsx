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

// Vertical (indented, file-tree-style) node — each employee on their own
// row, direct reports nested and indented below via a single left border
// rather than the old horizontal side-by-side branching, which only got
// harder to read (and to scroll) as the reporting chain grew wide.
function EmployeeRow({ node }: { node: OrgNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasChildren = node.children.length > 0;
  return (
    <div>
      <div className="flex items-center gap-2 py-1">
        <button
          className={`w-5 h-5 shrink-0 rounded border text-xs flex items-center justify-center ${
            hasChildren
              ? "border-border text-ink-muted hover:bg-surface-2"
              : "border-transparent text-transparent pointer-events-none"
          }`}
          onClick={() => setCollapsed((c) => !c)}
          title={hasChildren ? (collapsed ? `Show ${node.children.length} direct report(s)` : "Collapse") : undefined}
          type="button"
          tabIndex={hasChildren ? 0 : -1}
        >
          {hasChildren ? (collapsed ? "+" : "–") : ""}
        </button>
        <div className="card !p-2.5 !py-1.5 inline-flex items-center gap-3 max-w-md">
          <Link
            to={`/employees/${node.id}`}
            className="text-accent font-medium hover:underline inline-flex items-center gap-1.5 text-sm whitespace-nowrap"
          >
            {employeeDisplayName(node)}
            {node.is_offshore && <OffshoreIcon className="w-3.5 h-3.5 shrink-0" />}
          </Link>
          <p className="text-xs text-ink-muted whitespace-nowrap">
            {node.department || "—"}
            {node.rank ? ` · ${rankBadge(node.rank)}` : ""}
          </p>
        </div>
      </div>
      {hasChildren && !collapsed && (
        <div className="ml-2.5 pl-4 border-l border-border flex flex-col">
          {node.children.map((child) => (
            <EmployeeRow key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function VerticalTree({ roots, emptyText }: { roots: OrgNode[]; emptyText: string }) {
  if (roots.length === 0) return <p className="text-sm text-ink-muted">{emptyText}</p>;
  return (
    <div className="flex flex-col">
      {roots.map((root) => (
        <EmployeeRow key={root.id} node={root} />
      ))}
    </div>
  );
}

// Offshore staff are set aside into their own section rather than nested
// among onshore managers — an offshore employee never appears inside the
// main tree, and vice versa, each built as its own independent reporting
// tree (an onshore employee who happens to report to an offshore manager
// becomes a root of their own, same "manager not in this set" fallback
// buildReportToTree already uses for a scoped viewer).
function ReportToChart({ employees }: { employees: EmployeeSummary[] }) {
  const onshore = useMemo(() => employees.filter((e) => !e.is_offshore), [employees]);
  const offshore = useMemo(() => employees.filter((e) => e.is_offshore), [employees]);
  const onshoreRoots = useMemo(() => buildReportToTree(onshore), [onshore]);
  const offshoreRoots = useMemo(() => buildReportToTree(offshore), [offshore]);
  return (
    <div className="flex flex-col gap-8">
      <VerticalTree roots={onshoreRoots} emptyText="No on-going employees to show." />
      {offshore.length > 0 && (
        <div>
          <h2 className="font-display font-semibold text-sm text-ink-muted mb-2 flex items-center gap-1.5 pt-4 border-t border-border">
            <OffshoreIcon className="w-3.5 h-3.5" /> Offshore
          </h2>
          <VerticalTree roots={offshoreRoots} emptyText="No offshore employees to show." />
        </div>
      )}
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

// Leadership is a cross-cutting function, not tied to one department's usual
// alphabetical position — it's pinned first within every department so it
// reads the same way the Career Map already treats Leadership as sitting
// above the rest, regardless of what else that department has.
const LEADERSHIP_FUNCTION = "Leadership";

function sortedFunctionKeys(map: Map<string, unknown>, fallbackLast: string): string[] {
  return [...map.keys()].sort((a, b) => {
    if (a === LEADERSHIP_FUNCTION) return b === LEADERSHIP_FUNCTION ? 0 : -1;
    if (b === LEADERSHIP_FUNCTION) return 1;
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
        const functionKeys = sortedFunctionKeys(byFunction, "No function set");
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
  const [view, setView] = useState<"report-to" | "department">("department");
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
