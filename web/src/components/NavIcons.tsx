import type { ReactNode } from "react";

// One icon per top-level sidebar item (see AppLayout.tsx) — plain outline
// SVGs matching OffshoreIcon's own convention (24x24 viewBox, currentColor
// stroke) rather than pulling in an icon library for a handful of shapes.
// Sized and colored by the caller via className; these never hardcode a
// color, unlike OffshoreIcon, since a nav icon should follow its row's
// active/inactive text color rather than always reading one fixed color.
function Icon({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

// Employee Dashboard
export function DashboardIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="7" height="10" rx="1.5" />
      <rect x="14" y="3" width="7" height="6" rx="1.5" />
      <rect x="14" y="13" width="7" height="8" rx="1.5" />
      <rect x="3" y="17" width="7" height="4" rx="1.5" />
    </Icon>
  );
}

// AL, OT & BT (Submit/Manage/My Requests/Approvals)
export function CalendarIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <rect x="3" y="4.5" width="18" height="16" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M8 2.5v4M16 2.5v4" />
      <path d="M7.5 13.5h2M11 13.5h2M14.5 13.5h2M7.5 17h2M11 17h2" />
    </Icon>
  );
}

// Careers (Performance Profiles / Job Descriptions / Career Map / Org Chart)
export function BriefcaseIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5v-2a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2" />
      <path d="M3 12.5h18" />
      <path d="M10.5 12v1.5h3V12" />
    </Icon>
  );
}

// Code of Conduct
export function ShieldCheckIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <path d="M12 2.5 4.5 5.5v5.2c0 5 3.1 8.6 7.5 10.8 4.4-2.2 7.5-5.8 7.5-10.8V5.5L12 2.5z" />
      <path d="M8.7 12.2l2.2 2.2 4.4-4.4" />
    </Icon>
  );
}

// Collapsible group toggle (AL, OT & BT / Careers) — a straight arrow
// instead of a "▸" glyph, rotated by the caller when the group is open.
export function ArrowRightIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <path d="M4 12h16" />
      <path d="M13 6l7 6-7 6" />
    </Icon>
  );
}

// Employee Master
export function UsersIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.25" />
      <path d="M2.75 20c0-3.6 2.8-6.5 6.25-6.5S15.25 16.4 15.25 20" />
      <circle cx="17" cy="8.75" r="2.4" />
      <path d="M15.9 13.9c2.5.6 4.35 3 4.35 6.1" />
    </Icon>
  );
}
