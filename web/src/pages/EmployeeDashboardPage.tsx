import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import type { EmployeeSummary, RequestsDashboard } from "../lib/types";
import { CAREER_RANK_LABELS, CAREER_RANK_ORDER, rankBadge } from "../lib/types";
import { employeeDisplayName, shortEmployeeName } from "../lib/vietnamese";

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

const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

interface CalendarEvent {
  key: string;
  label: string;
  detail: string;
}

// Clips a [startStr, endStr] range (plain "YYYY-MM-DD" strings) down to the
// days it actually spends inside the given calendar month — a leave/trip
// that starts last month or ends next month still only contributes the
// day cells that belong to this grid.
function daysOfMonthInRange(startStr: string, endStr: string, year: number, month: number): number[] {
  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);
  const rangeStart = start < monthStart ? monthStart : start;
  const rangeEnd = end > monthEnd ? monthEnd : end;
  const days: number[] = [];
  const cur = new Date(rangeStart);
  while (cur <= rangeEnd) {
    days.push(cur.getDate());
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function MonthCalendar({
  year,
  month,
  eventsByDay,
  chipClass,
}: {
  year: number;
  month: number;
  eventsByDay: Map<number, CalendarEvent[]>;
  chipClass: string;
}) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-1 min-w-[560px] text-xs">
        {WEEKDAY_LABELS.map((d) => (
          <div key={d} className="text-center text-ink-faint font-medium pb-1">
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const events = day ? (eventsByDay.get(day) ?? []) : [];
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <div
              key={i}
              className={`min-h-[68px] rounded border p-1 ${day ? "border-border" : "border-transparent"} ${isToday ? "bg-accent-soft" : ""}`}
            >
              {day && <div className="text-ink-faint mb-0.5">{day}</div>}
              <div className="flex flex-col gap-0.5">
                {events.slice(0, 3).map((ev) => (
                  <div key={ev.key} className={`truncate rounded px-1 py-0.5 ${chipClass}`} title={`${ev.label} — ${ev.detail}`}>
                    {ev.label}
                  </div>
                ))}
                {events.length > 3 && <div className="text-ink-faint">+{events.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CalendarCard({
  title,
  emptyText,
  year,
  month,
  eventsByDay,
  chipClass,
  hasAnyEvents,
}: {
  title: string;
  emptyText: string;
  year: number;
  month: number;
  eventsByDay: Map<number, CalendarEvent[]>;
  chipClass: string;
  hasAnyEvents: boolean;
}) {
  return (
    <div className="card !p-4">
      <h2 className="font-display font-semibold mb-3">{title}</h2>
      {hasAnyEvents ? (
        <MonthCalendar year={year} month={month} eventsByDay={eventsByDay} chipClass={chipClass} />
      ) : (
        <p className="text-sm text-ink-muted">{emptyText}</p>
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

  // Drives the On Leave / Business Travel calendars and the Overtime
  // breakdown below — navigable via the Prev/Next controls next to the
  // calendars, unlike the Milestone cards further up (Contracts/Birthdays/
  // Anniversaries), which are deliberately always "this month" and use
  // their own separate `monthName` (see below) rather than this cursor.
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });
  const { year, month } = cursor;
  function shiftMonth(delta: number) {
    setCursor(({ year, month }) => {
      const d = new Date(year, month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  const isCurrentCalendarMonth = (() => {
    const n = new Date();
    return year === n.getFullYear() && month === n.getMonth();
  })();
  const monthParam = `${year}-${String(month + 1).padStart(2, "0")}`;
  const { data: requestsDashboard } = useQuery({
    queryKey: ["requests", "dashboard", monthParam],
    queryFn: () => api.get<RequestsDashboard>(`/requests/dashboard?month=${monthParam}`),
  });

  const calendars = useMemo(() => {
    const leaveByDay = new Map<number, CalendarEvent[]>();
    const btByDay = new Map<number, CalendarEvent[]>();
    for (const entry of requestsDashboard?.leave ?? []) {
      if (!entry.employee) continue;
      const label = shortEmployeeName(entry.employee);
      for (const day of daysOfMonthInRange(entry.start_date, entry.end_date, year, month)) {
        const list = leaveByDay.get(day) ?? [];
        list.push({ key: `${entry.employee_id}-${day}`, label, detail: entry.leave_type });
        leaveByDay.set(day, list);
      }
    }
    for (const entry of requestsDashboard?.bt ?? []) {
      if (!entry.employee) continue;
      const label = shortEmployeeName(entry.employee);
      for (const day of daysOfMonthInRange(entry.start_date, entry.end_date, year, month)) {
        const list = btByDay.get(day) ?? [];
        list.push({ key: `${entry.employee_id}-${day}`, label, detail: entry.destination });
        btByDay.set(day, list);
      }
    }
    const otHours: [string, number][] = (requestsDashboard?.ot ?? [])
      .filter((o) => o.employee)
      .map((o) => [employeeDisplayName(o.employee!), o.total_hours]);
    return { leaveByDay, btByDay, otHours };
  }, [requestsDashboard, year, month]);

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
    // The manager's name comes straight from each report's own embedded
    // report_to_employee (the server already resolves it via a self-join)
    // rather than re-looking the manager up in `active`/`all` — for a
    // scoped Team Lead/Head of Department viewer (see employeeScopeFor on
    // the server), the manager is very often the viewer themselves, who
    // isn't in their own scoped result set at all (scope is "reports to
    // me", not "me"), so that lookup would otherwise silently show
    // "Unknown".
    const directReportCounts = new Map<string, { label: string; count: number }>();
    for (const e of active) {
      if (!e.report_to_employee) continue;
      const key = e.report_to_employee.id;
      const existing = directReportCounts.get(key);
      if (existing) existing.count += 1;
      else directReportCounts.set(key, { label: employeeDisplayName(e.report_to_employee), count: 1 });
    }
    const byManager = [...directReportCounts.values()]
      .map(({ label, count }): [string, number] => [label, count])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const noManager = active.filter((e) => !e.report_to_employee).length;
    const offshore = active.filter((e) => e.is_offshore).length;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    // Last day of the current month — anything on or before this counts as
    // "expiring or already expired", not just a same-month match, so a
    // contract that lapsed last month (or last year) still surfaces here
    // instead of silently dropping off the list once its month has passed.
    const endOfThisMonth = new Date(currentYear, currentMonth + 1, 0);

    const expiringContracts = active
      .filter((e) => e.contract_end_date)
      .map((e) => ({ e, d: parseLocalDate(e.contract_end_date!) }))
      .filter(({ d }) => d <= endOfThisMonth)
      .sort((a, b) => a.d.getTime() - b.d.getTime())
      .map(({ e, d }) => ({
        id: e.id,
        label: employeeDisplayName(e),
        detail: d < now ? `Overdue since ${formatFullDate(e.contract_end_date!)}` : formatFullDate(e.contract_end_date!),
      }));

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

    // Contract Type is the one field that stands in for "has a contract on
    // file at all" — someone missing it is missing the whole section, not
    // just one detail, regardless of what's set for length/no./dates.
    const missingContract = active
      .filter((e) => !e.contract_type)
      .map((e) => ({ id: e.id, label: employeeDisplayName(e) }))
      .sort((a, b) => a.label.localeCompare(b.label))
      .map((e) => ({ ...e, detail: "Missing" }));

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
      missingContract,
    };
  }, [data]);

  if (isLoading) return <p className="text-sm text-ink-muted">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">Couldn't load employee data.</p>;

  const monthName = MONTH_NAMES[new Date().getMonth()];
  const cursorMonthLabel = `${MONTH_NAMES[month]} ${year}`;

  return (
    <div className="max-w-7xl">
      <h1 className="font-display font-bold text-xl mb-4">Employee Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Card label="On-going" value={stats.active.length} colorClass="text-accent" />
        <Card label="Archived" value={stats.archived.length} colorClass="text-ink-muted" />
        <Card label="Departments" value={stats.byDepartment.length} colorClass="text-accent-2" />
        <Card label="Off-shore" value={stats.offshore} colorClass="text-status-info" />
        <Card label="No manager set" value={stats.noManager} colorClass="text-status-warning" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MilestoneCard
          title={`Contracts Expired or Expiring — ${monthName}`}
          borderClass="border-l-status-critical"
          pillClass="bg-status-critical-soft text-status-critical"
          items={stats.expiringContracts}
          emptyText="No contracts expired or expiring."
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
        <MilestoneCard
          title="Missing Contract Information"
          borderClass="border-l-status-warning"
          pillClass="bg-status-warning-soft text-status-warning"
          items={stats.missingContract}
          emptyText="Everyone has contract information on file."
        />
      </div>

      <div className="flex items-center gap-3 mb-3">
        <button className="btn-secondary !px-2 !py-1 text-sm" type="button" onClick={() => shiftMonth(-1)}>
          ‹ Prev
        </button>
        <span className="font-display font-semibold text-sm w-24 text-center">{cursorMonthLabel}</span>
        <button className="btn-secondary !px-2 !py-1 text-sm" type="button" onClick={() => shiftMonth(1)}>
          Next ›
        </button>
        {!isCurrentCalendarMonth && (
          <button
            className="text-sm text-accent hover:underline"
            type="button"
            onClick={() => {
              const n = new Date();
              setCursor({ year: n.getFullYear(), month: n.getMonth() });
            }}
          >
            Back to this month
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <CalendarCard
          title={`On Leave — ${cursorMonthLabel}`}
          emptyText={`No approved leave in ${cursorMonthLabel}.`}
          year={year}
          month={month}
          eventsByDay={calendars.leaveByDay}
          chipClass="bg-accent-green/20 text-ink border-l-2 border-accent-green"
          hasAnyEvents={calendars.leaveByDay.size > 0}
        />
        <CalendarCard
          title={`Business Travel — ${cursorMonthLabel}`}
          emptyText={`No approved business travel in ${cursorMonthLabel}.`}
          year={year}
          month={month}
          eventsByDay={calendars.btByDay}
          chipClass="bg-accent-periwinkle/20 text-ink border-l-2 border-accent-periwinkle"
          hasAnyEvents={calendars.btByDay.size > 0}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BreakdownCard title="By Department" counts={stats.byDepartment} barClass="bg-accent" />
        <BreakdownCard
          title="By Career Rank"
          counts={stats.byRank.map(([label, count]): [string, number] => [rankBadge(label), count])}
          barClass="bg-accent-2"
        />
        <BreakdownCard title="By Office Location" counts={stats.byLocation} barClass="bg-accent" />
        <BreakdownCard title="Team Size by Manager" counts={stats.byManager} barClass="bg-accent-2" />
        <BreakdownCard
          title={`Overtime — ${cursorMonthLabel} (hours)`}
          counts={calendars.otHours}
          barClass="bg-accent-lavender"
        />
      </div>
    </div>
  );
}
