import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";
import { ACCESS_LEVEL_LABELS } from "../lib/types";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"}`;

// Header buttons (User Management, Audit Log) — a bordered "chip" style
// distinct from the sidebar's flat nav links, matching po-so-tracker's own
// header-button treatment for the same kind of admin-only, out-of-flow pages.
const headerBtnClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md border px-3 py-1.5 text-sm whitespace-nowrap transition-colors ${
    isActive ? "border-accent bg-accent-soft text-accent font-medium" : "border-border text-ink-muted hover:text-ink hover:bg-surface-2"
  }`;

export function AppLayout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const canAdminUsers = user?.capabilities.includes("user.admin") ?? false;
  const canViewEmployees = user?.capabilities.includes("employee.view") ?? false;
  const canManageRequests = user?.capabilities.includes("request.manageAll") ?? false;
  // Employee Master's own NavLink can't use its default prefix match here —
  // /employees/dashboard and /employees/org-chart live under the same
  // "/employees" prefix but are their own top-level nav items now, so they
  // need to be excluded explicitly rather than also lighting up Employee
  // Master.
  const employeeMasterActive =
    pathname.startsWith("/employees") &&
    !pathname.startsWith("/employees/dashboard") &&
    !pathname.startsWith("/employees/org-chart");
  // Same reasoning as Employee Master above — /requests/manage and
  // /requests/import are their own top-level nav items under the same
  // "/requests" prefix, so a plain prefix-matching NavLink would light up
  // both "Submit" and "Manage" at once while on the Manage page.
  const submitRequestsActive =
    pathname.startsWith("/requests") &&
    !pathname.startsWith("/requests/manage") &&
    !pathname.startsWith("/requests/import");
  // Import is Admin/BOD-only and only reached from a link on the Manage
  // page (no sidebar item of its own), so it counts as part of "Manage"
  // being active rather than falling back to "Submit" via prefix match.
  const manageRequestsActive = pathname.startsWith("/requests/manage") || pathname.startsWith("/requests/import");

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border px-5 py-7 hidden sm:flex sm:flex-col">
        <div>
          <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
          <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint">Careers and Foundation</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {/* Visible to every signed-in user, same reasoning as My Profile —
              self-service AL/OT/BT submission isn't gated by capability. */}
          <Link to="/requests" className={navLinkClass({ isActive: submitRequestsActive })}>
            Submit AL, OT & BT
          </Link>
          {canManageRequests && (
            <Link to="/requests/manage" className={navLinkClass({ isActive: manageRequestsActive })}>
              Manage AL, OT & BT
            </Link>
          )}
          {canViewEmployees && (
            <NavLink to="/employees/dashboard" className={navLinkClass}>
              Employee Dashboard
            </NavLink>
          )}
          <NavLink to="/profiles" end className={navLinkClass}>
            Performance Profiles
          </NavLink>
          <NavLink to="/job-descriptions" className={navLinkClass}>
            Job Descriptions
          </NavLink>
          {/* Viewable by every access level — the page itself gates its own
              Add/Edit/Archive controls on careerrole.* capabilities. */}
          <NavLink to="/career-map" className={navLinkClass}>
            Career Map
          </NavLink>
          {/* Viewable by every access level, same as Career Map — only the
              edit mode is gated (codeofconduct.edit, Admin/BOD). */}
          <NavLink to="/code-of-conduct" className={navLinkClass}>
            Code of Conduct
          </NavLink>
          {canViewEmployees && (
            <Link to="/employees" className={navLinkClass({ isActive: employeeMasterActive })}>
              Employee Master
            </Link>
          )}
          {canViewEmployees && (
            <NavLink to="/employees/org-chart" className={navLinkClass}>
              Org Chart
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-3 flex items-center gap-2 flex-wrap">
          {/* Visible to every signed-in user regardless of capability — this
              is where anyone (even a Team Member with no HR capabilities at
              all) can see and correct their own Personal Information and
              Emergency Contact; see GET/PATCH /employees/me. */}
          <NavLink to="/my-profile" className={headerBtnClass}>
            My Profile
          </NavLink>
          {canAdminUsers && (
            <NavLink to="/users" className={headerBtnClass}>
              User Management
            </NavLink>
          )}
          {canAdminUsers && (
            <NavLink to="/audit-log" className={headerBtnClass}>
              Audit Log
            </NavLink>
          )}
          <span className="flex-1" />
          <Link
            to="/careers"
            className="text-sm text-accent border border-accent/30 rounded-md px-3 py-1.5 hover:bg-accent-soft whitespace-nowrap"
          >
            To Unios Career Page
          </Link>
          <span className="text-sm text-ink-muted whitespace-nowrap">
            Signed in as{" "}
            <Link to="/account" className="text-ink font-medium hover:underline" title="Your name and password">
              {user?.name ?? "…"}
            </Link>{" "}
            <span className="font-mono text-xs text-ink-faint">
              ({user ? ACCESS_LEVEL_LABELS[user.access_level] : "…"})
            </span>
          </span>
          <button onClick={() => signOut()} className="text-sm text-ink-muted hover:text-ink whitespace-nowrap">
            Sign out
          </button>
        </header>
        <main className="flex-1 px-6 py-6 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
