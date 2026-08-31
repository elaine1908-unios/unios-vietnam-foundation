import { Link, Outlet } from "react-router-dom";
import { UniosLogo } from "../components/UniosLogo";

// No auth, no sidebar nav, no sign-out — this is the one surface a
// logged-out visitor (a job candidate) can reach. Deliberately minimal.
export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-accent-2 px-6 py-4 flex items-center justify-between gap-4">
        <Link to="/careers" aria-label="Unios home">
          <UniosLogo className="h-6 text-white" />
        </Link>
        <Link
          to="/login"
          className="text-sm text-white border border-white/30 rounded-md px-3 py-1.5 hover:bg-white/10 whitespace-nowrap"
        >
          For Unios Team
        </Link>
      </header>
      <main className="flex-1 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
