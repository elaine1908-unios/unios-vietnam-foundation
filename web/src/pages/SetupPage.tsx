import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";

// First-run only. Reachable at /setup, but only does anything while the
// users table is empty — server/src/routes/auth.ts's POST /setup refuses
// once any account exists, and this page checks the same status up front so
// it doesn't dead-end into that error for everyone after the fact.
export function SetupPage() {
  const { user, refresh } = useAuth();
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get<{ needsSetup: boolean }>("/auth/setup-status")
      .then((r) => setNeedsSetup(r.needsSetup))
      .catch(() => setNeedsSetup(false));
  }, []);

  if (user) return <Navigate to="/profiles" replace />;
  if (needsSetup === null) return null;
  if (needsSetup === false) return <Navigate to="/login" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/auth/setup", { name, email, password });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="card w-full max-w-sm">
        <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
        <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint mb-4">
          Career and Foundation
        </p>
        <p className="font-display font-bold text-lg mb-1">Set up the first account</p>
        <p className="text-sm text-ink-muted mb-6">
          This creates the first Owner account. Every other account is created from here afterward.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <input className="input" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="btn-primary mt-2" type="submit" disabled={submitting}>
            {submitting ? "Creating…" : "Create Owner account"}
          </button>
        </form>
      </div>
    </div>
  );
}
