import { Link, NavLink, Outlet } from "react-router-dom";
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
  const canAdminUsers = user?.capabilities.includes("user.admin") ?? false;
  const canViewEmployees = user?.capabilities.includes("employee.view") ?? false;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border px-5 py-7 hidden sm:flex sm:flex-col">
        <div>
          <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
          <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint">Career and Foundation</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          <NavLink to="/profiles" end className={navLinkClass}>
            Profiles
          </NavLink>
          <NavLink to="/job-descriptions" className={navLinkClass}>
            Job Descriptions
          </NavLink>
          {/* Viewable by every access level — the page itself gates its own
              Add/Edit/Archive controls on careerrole.* capabilities. */}
          <NavLink to="/career-map" className={navLinkClass}>
            Career Map
          </NavLink>
          {canViewEmployees && (
            <NavLink to="/employees" className={navLinkClass}>
              Employee Master
            </NavLink>
          )}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-3 flex items-center gap-2 flex-wrap">
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
