import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";

export function AppLayout() {
  const { user, signOut } = useAuth();
  const isTeamLead = user?.role === "team_lead";

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border px-5 py-7 hidden sm:flex sm:flex-col">
        <div>
          <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
          <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint">foundation</p>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"}`
            }
          >
            Profiles
          </NavLink>
          <NavLink
            to="/job-descriptions"
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"}`
            }
          >
            Job Descriptions
          </NavLink>
          {isTeamLead && (
            <NavLink
              to="/users"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"}`
              }
            >
              User Management
            </NavLink>
          )}
          {isTeamLead && (
            <NavLink
              to="/career-map"
              className={({ isActive }) =>
                `rounded-md px-3 py-2 text-sm ${isActive ? "bg-accent-soft text-accent font-medium" : "text-ink-muted hover:bg-surface-2"}`
              }
            >
              Career Map
            </NavLink>
          )}
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
              ({user?.title || (user?.role === "team_lead" ? "Team Lead" : "Team Member")})
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
