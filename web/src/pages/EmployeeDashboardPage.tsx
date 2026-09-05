import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeSummary } from "../lib/types";
import { CAREER_RANK_LABELS, CAREER_RANK_ORDER } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";

function Card({ label, value }: { label: string; value: number }) {
  return (
    <div className="card !p-4">
      <div className="text-2xl font-display font-bold">{value}</div>
      <div className="text-sm text-ink-muted">{label}</div>
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-40 shrink-0 truncate text-sm" title={label}>
        {label}
      </div>
      <div className="flex-1 bg-surface-2 rounded h-5 overflow-hidden">
        <div className="bg-accent h-5 rounded" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 shrink-0 text-right text-sm text-ink-muted">{count}</div>
    </div>
  );
}

function BreakdownCard({ title, counts }: { title: string; counts: [string, number][] }) {
  const max = Math.max(1, ...counts.map(([, c]) => c));
  return (
    <div className="card !p-4">
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {counts.length === 0 ? (
        <p className="text-sm text-ink-muted">No data yet.</p>
      ) : (
        counts.map(([label, count]) => <BarRow key={label} label={label} count={count} max={max} />)
      )}
    </div>
  );
}

function countBy(employees: EmployeeSummary[], pick: (e: EmployeeSummary) => string | null): [string, number][] {
  const counts = new Map<string, number>();
  for (const e of employees) {
    const key = pick(e) || "Not set";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

export function EmployeeDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["employees", "", true],
    queryFn: () => api.get<EmployeeSummary[]>("/employees?includeArchived=true"),
  });

  const stats = useMemo(() => {
    const all = data ?? [];
    const active = all.filter((e) => !e.is_archived);
    const archived = all.filter((e) => e.is_archived);

    const byDepartment = countBy(active, (e) => e.department);
    const byLocation = countBy(active, (e) => e.office_location);

    // Ordered by the Career Map's own progression (Core -> Divisional)
    // rather than by count, so the shape of the org is easy to read at a
    // glance instead of jumping around by size.
    const rankOrder = CAREER_RANK_ORDER.map((k) => CAREER_RANK_LABELS[k]);
    const rankCounts = countBy(active, (e) => e.rank);
    const byRank = [
      ...rankOrder.map((label) => [label, rankCounts.find(([l]) => l === label)?.[1] ?? 0] as [string, number]),
      ...rankCounts.filter(([label]) => !rankOrder.includes(label)),
    ].filter(([, count]) => count > 0);

    // Managers ranked by direct-report count — a quick read on team sizes
    // now that Report To exists, without needing a full org chart view.
    const directReportCounts = new Map<string, number>();
    for (const e of active) {
      if (!e.report_to_employee) continue;
      const key = e.report_to_employee.id;
      directReportCounts.set(key, (directReportCounts.get(key) ?? 0) + 1);
    }
    const byManager = [...directReportCounts.entries()]
      .map(([id, count]): [string, number] => {
        const manager = active.find((e) => e.id === id) ?? all.find((e) => e.id === id);
        return [manager ? employeeDisplayName(manager) : "Unknown", count];
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const noManager = active.filter((e) => !e.report_to_employee).length;
    const offshore = active.filter((e) => e.is_offshore).length;

    return { active, archived, byDepartment, byLocation, byRank, byManager, noManager, offshore };
  }, [data]);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">Couldn't load employee data.</p>;

  return (
    <div className="max-w-7xl">
      <Link to="/employees" className="text-sm text-accent hover:underline">
        ← Employee Master
      </Link>
      <h1 className="font-display font-bold text-xl mt-1 mb-4">Employee Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card label="On-going" value={stats.active.length} />
        <Card label="Archived" value={stats.archived.length} />
        <Card label="Departments" value={stats.byDepartment.length} />
        <Card label="Off-shore" value={stats.offshore} />
        <Card label="No manager set" value={stats.noManager} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreakdownCard title="By Department" counts={stats.byDepartment} />
        <BreakdownCard title="By Career Rank" counts={stats.byRank} />
        <BreakdownCard title="By Office Location" counts={stats.byLocation} />
        <BreakdownCard title="Team Size by Manager" counts={stats.byManager} />
      </div>
    </div>
  );
}
