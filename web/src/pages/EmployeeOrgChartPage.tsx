import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeSummary } from "../lib/types";
import { rankBadge } from "../lib/types";
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
function buildTree(employees: EmployeeSummary[]): OrgNode[] {
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

function TreeNode({ node }: { node: OrgNode }) {
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
            <TreeNode key={child.id} node={child} />
          ))}
        </ul>
      )}
    </li>
  );
}

export function EmployeeOrgChartPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["employees", "org-chart"],
    queryFn: () => api.get<EmployeeSummary[]>("/employees"),
  });

  const roots = useMemo(() => (data ? buildTree(data) : []), [data]);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">Couldn't load employee data.</p>;

  return (
    <div>
      <Link to="/employees" className="text-sm text-accent hover:underline">
        ← Employee Master
      </Link>
      <h1 className="font-display font-bold text-xl mt-1 mb-4">Org Chart</h1>
      {roots.length === 0 ? (
        <p className="text-sm text-ink-muted">No on-going employees to show.</p>
      ) : (
        <div className="overflow-x-auto pb-6">
          <ul className="org-tree">
            {roots.map((root) => (
              <TreeNode key={root.id} node={root} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
