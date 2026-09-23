import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";
import { api } from "../lib/api";
import { ACCESS_LEVEL_LABELS } from "../lib/types";
import type { RequestRecord } from "../lib/types";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  DashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "../components/NavIcons";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"}`;

const groupToggleClass = (active: boolean) =>
  `w-full flex items-center justify-between rounded-md px-3 py-2 text-sm ${
    active ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"
  }`;

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

  // "AL, OT & BT" is a collapsible group (Submit/Manage/My Requests/
  // Approvals) rather than flat nav items, so each sub-link needs its own
  // exact/prefix match instead of one NavLink's default prefix match —
  // otherwise "Submit" would also light up on /requests/manage, etc.
  // Import has no sidebar item of its own (reached only from a link on
  // Manage), so it counts as part of Manage being active.
  const submitRequestsActive = pathname === "/requests";
  const manageRequestsActive = pathname.startsWith("/requests/manage") || pathname.startsWith("/requests/import");
  const myRequestsActive = pathname.startsWith("/requests/mine");
  const approvalsActive = pathname.startsWith("/requests/approvals");
  const requestsGroupActive = pathname.startsWith("/requests");
  const [requestsExpanded, setRequestsExpanded] = useState(() => pathname.startsWith("/requests"));
  useEffect(() => {
    if (pathname.startsWith("/requests")) setRequestsExpanded(true);
  }, [pathname]);

  // "Careers" groups Performance Profiles/Job Descriptions/Career Map/Org
  // Chart, same collapsible pattern as "AL, OT & BT" above. Performance
  // Profiles keeps its pre-existing exact-match behavior (a profile detail
  // page doesn't light up the "Performance Profiles" row specifically) —
  // only the group-active/auto-expand check is a broader prefix match, so
  // the group itself still opens up while viewing one.
  const performanceProfilesActive = pathname === "/profiles";
  const jobDescriptionsActive = pathname.startsWith("/job-descriptions");
  const careerMapActive = pathname.startsWith("/career-map");
  const orgChartActive = pathname.startsWith("/employees/org-chart");
  const careersGroupActive =
    pathname.startsWith("/profiles") ||
    pathname.startsWith("/job-descriptions") ||
    pathname.startsWith("/career-map") ||
    pathname.startsWith("/employees/org-chart");
  const [careersExpanded, setCareersExpanded] = useState(() => careersGroupActive);
  useEffect(() => {
    if (careersGroupActive) setCareersExpanded(true);
  }, [pathname, careersGroupActive]);

  // Fetched once here (rather than on whichever page happens to be open)
  // so the sidebar's Approvals badge stays live regardless of which
  // AL/OT/BT page you're actually on — same query key as ApprovalsPage/
  // MyRequestsPage use for their own fetches, so this dedupes with them.
  const { data: approvals } = useQuery({
    queryKey: ["requests", "approvals"],
    queryFn: () => api.get<RequestRecord[]>("/requests/approvals"),
  });
  const pendingApprovalCount = approvals?.length ?? 0;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border px-5 py-7 hidden sm:flex sm:flex-col">
        <div>
          <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
          <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint">Careers and Foundation</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {/* On top — the default landing page for a Team Lead or anyone
              with direct reports (see LoginPage.tsx), so it's the first
              thing they see in the sidebar too. */}
          {canViewEmployees && (
            <NavLink to="/employees/dashboard" className={navLinkClass}>
              <DashboardIcon className="w-4 h-4 shrink-0" />
              Employee Dashboard
            </NavLink>
          )}
          <div>
            <button
              type="button"
              onClick={() => setRequestsExpanded((v) => !v)}
              className={groupToggleClass(requestsGroupActive)}
              aria-expanded={requestsExpanded}
            >
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 shrink-0" />
                AL, OT & BT
              </span>
              <ArrowRightIcon
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${requestsExpanded ? "rotate-90" : ""}`}
              />
            </button>
            {requestsExpanded && (
              <div className="flex flex-col gap-1 mt-1 pl-3 border-l border-border ml-3">
                {/* Visible to every signed-in user, same reasoning as My
                    Profile — self-service AL/OT/BT submission isn't gated
                    by capability. */}
                <Link to="/requests" className={navLinkClass({ isActive: submitRequestsActive })}>
                  Submit
                </Link>
                {canManageRequests && (
                  <Link to="/requests/manage" className={navLinkClass({ isActive: manageRequestsActive })}>
                    Manage
                  </Link>
                )}
                <Link to="/requests/mine" className={navLinkClass({ isActive: myRequestsActive })}>
                  My Requests
                </Link>
                <Link to="/requests/approvals" className={navLinkClass({ isActive: approvalsActive })}>
                  <span className="inline-flex items-center gap-1.5">
                    Approvals
                    {pendingApprovalCount > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-status-critical text-white text-xs font-medium px-1">
                        {pendingApprovalCount}
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => setCareersExpanded((v) => !v)}
              className={groupToggleClass(careersGroupActive)}
              aria-expanded={careersExpanded}
            >
              <span className="flex items-center gap-2">
                <BriefcaseIcon className="w-4 h-4 shrink-0" />
                Careers
              </span>
              <ArrowRightIcon
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${careersExpanded ? "rotate-90" : ""}`}
              />
            </button>
            {careersExpanded && (
              <div className="flex flex-col gap-1 mt-1 pl-3 border-l border-border ml-3">
                <Link to="/profiles" className={navLinkClass({ isActive: performanceProfilesActive })}>
                  Performance Profiles
                </Link>
                <Link to="/job-descriptions" className={navLinkClass({ isActive: jobDescriptionsActive })}>
                  Job Descriptions
                </Link>
                {/* Viewable by every access level — the page itself gates
                    its own Add/Edit/Archive controls on careerrole.*
                    capabilities. */}
                <Link to="/career-map" className={navLinkClass({ isActive: careerMapActive })}>
                  Career Map
                </Link>
                {canViewEmployees && (
                  <Link to="/employees/org-chart" className={navLinkClass({ isActive: orgChartActive })}>
                    Org Chart
                  </Link>
                )}
              </div>
            )}
          </div>
          {/* Viewable by every access level, same as Career Map — only the
              edit mode is gated (codeofconduct.edit, Admin/BOD). */}
          <NavLink to="/code-of-conduct" className={navLinkClass}>
            <ShieldCheckIcon className="w-4 h-4 shrink-0" />
            Code of Conduct
          </NavLink>
          {canViewEmployees && (
            <Link to="/employees" className={navLinkClass({ isActive: employeeMasterActive })}>
              <UsersIcon className="w-4 h-4 shrink-0" />
              Employee Master
            </Link>
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
