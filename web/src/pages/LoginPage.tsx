import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";

export function LoginPage() {
  const { user, loading, devLoginEnabled, azureConfigured, devSignIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  async function handleDevSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await devSignIn(name, email);
    setSubmitting(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="card w-full max-w-sm">
        <UniosLogo className="h-6 text-accent-2 mb-4" />
        <p className="font-display font-bold text-lg mb-1">Performance Profiles</p>
        <p className="text-sm text-ink-muted mb-6">Team Lead &amp; Team Member portal</p>

        {!azureConfigured && !devLoginEnabled && (
          <p className="text-sm text-ink-muted">
            Microsoft sign-in isn't configured yet. See <span className="font-mono text-xs">server/.env.example</span>.
          </p>
        )}

        {azureConfigured && (
          <a href="/api/auth/login" className="btn-primary w-full text-center block mb-4">
            Sign in with Microsoft
          </a>
        )}

        {devLoginEnabled && (
          <div className="mt-2">
            <div className="flex items-center gap-2 text-xs text-ink-faint mb-3">
              <div className="flex-1 border-t border-border" />
              <span>dev login (local only)</span>
              <div className="flex-1 border-t border-border" />
            </div>
            <form onSubmit={handleDevSubmit} className="flex flex-col gap-2">
              <input
                className="input"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <input
                className="input"
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-secondary" type="submit" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in (dev)"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
