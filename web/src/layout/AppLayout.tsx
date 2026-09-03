import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";
import { ACCESS_LEVEL_LABELS } from "../lib/types";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"}`;

export function AppLayout() {
  const { user, signOut } = useAuth();
  const canAdminUsers = user?.capabilities.includes("user.admin") ?? false;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border px-5 py-7 hidden sm:flex sm:flex-col">
        <div>
          <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
          <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint">Unios Career and Foundations</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          <NavLink to="/" end className={navLinkClass}>
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
          {canAdminUsers && (
            <NavLink to="/users" className={navLinkClass}>
              User Management
            </NavLink>
          )}
          {canAdminUsers && (
            <NavLink to="/audit-log" className={navLinkClass}>
              Audit Log
            </NavLink>
          )}
          <NavLink to="/account" className={navLinkClass}>
            My Account
          </NavLink>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="border-b border-border px-6 py-3 flex items-center justify-between gap-4">
          <span className="flex-1" />
          <Link
            to="/careers"
            className="text-sm text-accent border border-accent/30 rounded-md px-3 py-1.5 hover:bg-accent-soft whitespace-nowrap"
          >
            To Unios Career Page
          </Link>
          <span className="text-sm text-ink-muted whitespace-nowrap">
            Signed in as <span className="text-ink font-medium">{user?.name ?? "…"}</span>{" "}
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
