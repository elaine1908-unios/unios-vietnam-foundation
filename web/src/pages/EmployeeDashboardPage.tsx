import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeSummary } from "../lib/types";
import { CAREER_RANK_LABELS, CAREER_RANK_ORDER } from "../lib/types";
import { employeeDisplayName } from "../lib/vietnamese";

function Card({ label, value, colorClass = "text-ink" }: { label: string; value: number; colorClass?: string }) {
  return (
    <div className="card !p-4">
      <div className={`text-2xl font-display font-bold ${colorClass}`}>{value}</div>
      <div className="text-sm text-ink-muted">{label}</div>
    </div>
  );
}

function BarRow({ label, count, max, barClass }: { label: string; count: number; max: number; barClass: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="w-40 shrink-0 truncate text-sm" title={label}>
        {label}
      </div>
      <div className="flex-1 bg-surface-2 rounded h-5 overflow-hidden">
        <div className={`h-5 rounded ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 shrink-0 text-right text-sm text-ink-muted">{count}</div>
    </div>
  );
}

function BreakdownCard({
  title,
  counts,
  barClass = "bg-accent",
}: {
  title: string;
  counts: [string, number][];
  barClass?: string;
}) {
  const max = Math.max(1, ...counts.map(([, c]) => c));
  return (
    <div className="card !p-4">
      <h2 className="font-display font-semibold mb-3 flex items-center gap-2">
        <span className={`inline-block w-2.5 h-2.5 rounded-full ${barClass}`} />
        {title}
      </h2>
      {counts.length === 0 ? (
        <p className="text-sm text-ink-muted">No data yet.</p>
      ) : (
        counts.map(([label, count]) => <BarRow key={label} label={label} count={count} max={max} barClass={barClass} />)
      )}
    </div>
  );
}

// A colored left border + a colored detail pill per row — used for the
// three "this month" call-out sections, each with its own accent so
// they're easy to tell apart at a glance (contract expiry reads as
// urgent, birthdays as celebratory, anniversaries as a milestone).
function MilestoneCard({
  title,
  borderClass,
  pillClass,
  items,
  emptyText,
}: {
  title: string;
  borderClass: string;
  pillClass: string;
  items: { id: string; label: string; detail: string }[];
  emptyText: string;
}) {
  return (
    <div className={`card !p-4 border-l-4 ${borderClass}`}>
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <Link to={`/employees/${item.id}`} className="text-accent hover:underline truncate">
                {item.label}
              </Link>
              <span className={`shrink-0 text-xs rounded px-1.5 py-0.5 font-medium ${pillClass}`}>{item.detail}</span>
            </li>
          ))}
        </ul>
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

// Stored dates are plain "YYYY-MM-DD" strings — parsed as local calendar
// dates (not UTC) so a birthday/anniversary reads on the day it actually
// is, regardless of the viewer's timezone offset.
function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonthDay(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatFullDate(dateStr: string): string {
  const d = parseLocalDate(dateStr);
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const MILESTONE_YEARS = new Set([1, 3, 5, 10]);

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

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const expiringContracts = active
      .filter((e) => e.contract_end_date)
      .map((e) => ({ e, d: parseLocalDate(e.contract_end_date!) }))
      .filter(({ d }) => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
      .sort((a, b) => a.d.getDate() - b.d.getDate())
      .map(({ e }) => ({ id: e.id, label: employeeDisplayName(e), detail: formatFullDate(e.contract_end_date!) }));

    const birthdaysThisMonth = active
      .filter((e) => e.birthday)
      .map((e) => ({ e, d: parseLocalDate(e.birthday!) }))
      .filter(({ d }) => d.getMonth() === currentMonth)
      .sort((a, b) => a.d.getDate() - b.d.getDate())
      .map(({ e }) => ({ id: e.id, label: employeeDisplayName(e), detail: formatMonthDay(e.birthday!) }));

    const milestones = active
      .filter((e) => e.commencement_date)
      .map((e) => ({ e, d: parseLocalDate(e.commencement_date!) }))
      .filter(({ d }) => d.getMonth() === currentMonth && MILESTONE_YEARS.has(currentYear - d.getFullYear()))
      .sort((a, b) => a.d.getDate() - b.d.getDate())
      .map(({ e, d }) => {
        const years = currentYear - d.getFullYear();
        return { id: e.id, label: employeeDisplayName(e), detail: `${years} year${years === 1 ? "" : "s"}` };
      });

    return {
      active,
      archived,
      byDepartment,
      byLocation,
      byRank,
      byManager,
      noManager,
      offshore,
      expiringContracts,
      birthdaysThisMonth,
      milestones,
    };
  }, [data]);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">Couldn't load employee data.</p>;

  const monthName = MONTH_NAMES[new Date().getMonth()];

  return (
    <div className="max-w-7xl">
      <Link to="/employees" className="text-sm text-accent hover:underline">
        ← Employee Master
      </Link>
      <h1 className="font-display font-bold text-xl mt-1 mb-4">Employee Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card label="On-going" value={stats.active.length} colorClass="text-accent" />
        <Card label="Archived" value={stats.archived.length} colorClass="text-ink-muted" />
        <Card label="Departments" value={stats.byDepartment.length} colorClass="text-accent-2" />
        <Card label="Off-shore" value={stats.offshore} colorClass="text-status-info" />
        <Card label="No manager set" value={stats.noManager} colorClass="text-status-warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <MilestoneCard
          title={`Contracts Expiring — ${monthName}`}
          borderClass="border-l-status-critical"
          pillClass="bg-status-critical-soft text-status-critical"
          items={stats.expiringContracts}
          emptyText="No contracts expiring this month."
        />
        <MilestoneCard
          title={`Birthdays — ${monthName}`}
          borderClass="border-l-status-positive"
          pillClass="bg-status-positive-soft text-status-positive"
          items={stats.birthdaysThisMonth}
          emptyText="No birthdays this month."
        />
        <MilestoneCard
          title={`Work Anniversaries — ${monthName}`}
          borderClass="border-l-status-info"
          pillClass="bg-status-info-soft text-status-info"
          items={stats.milestones}
          emptyText="No 1/3/5/10-year milestones this month."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreakdownCard title="By Department" counts={stats.byDepartment} barClass="bg-accent" />
        <BreakdownCard title="By Career Rank" counts={stats.byRank} barClass="bg-accent-2" />
        <BreakdownCard title="By Office Location" counts={stats.byLocation} barClass="bg-accent" />
        <BreakdownCard title="Team Size by Manager" counts={stats.byManager} barClass="bg-accent-2" />
      </div>
    </div>
  );
}
