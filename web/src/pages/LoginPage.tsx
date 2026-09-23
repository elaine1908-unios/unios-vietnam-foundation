import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { UniosLogo } from "../components/UniosLogo";
import { api } from "../lib/api";

export function LoginPage() {
  const { user, loading, signIn, completeTwoFactor } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  // Set once the password check succeeds on an account with 2FA enabled —
  // switches the form to "enter your code" instead of completing sign-in.
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [code, setCode] = useState("");

  useEffect(() => {
    api
      .get<{ needsSetup: boolean }>("/auth/setup-status")
      .then((r) => setNeedsSetup(r.needsSetup))
      .catch(() => {});
  }, []);

  if (loading) return null;
  if (user) {
    // Employee Dashboard is the default landing page for anyone who can
    // reach it (Team Lead and up, via employee.view); a plain Team Member
    // lands on Performance Profiles instead, same as before this page
    // existed. Extending this to "anyone with direct reports" would also
    // need widening actual data access (currently Team Lead+ only) — asked
    // about and declined, so this stays capability-based.
    const landingPath = user.capabilities.includes("employee.view") ? "/employees/dashboard" : "/profiles";
    return <Navigate to={landingPath} replace />;
  }
  if (needsSetup) return <Navigate to="/setup" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await signIn(email, password);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else if (result.requires2fa) {
      setTempToken(result.tempToken);
    }
  }

  async function handleTwoFactorSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await completeTwoFactor(tempToken!, code);
    setSubmitting(false);
    if (result.error) setError(result.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="card w-full max-w-sm">
        <UniosLogo className="h-8 text-accent-2 mb-[3px]" />
        <p className="font-display font-normal text-sm tracking-[0.0125em] text-ink-faint mb-4">
          Careers and Foundation
        </p>
        <p className="text-sm text-ink-muted mb-6">Career Portal - for Unios Vietnam team only</p>

        {tempToken ? (
          <form onSubmit={handleTwoFactorSubmit} className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted mb-1">Enter the 6-digit code from your authenticator app.</p>
            <input
              className="input"
              inputMode="numeric"
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              autoFocus
              required
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button className="btn-primary mt-2" type="submit" disabled={submitting}>
              {submitting ? "Verifying…" : "Verify"}
            </button>
            <button
              className="text-sm text-ink-muted hover:text-ink"
              type="button"
              onClick={() => {
                setTempToken(null);
                setCode("");
                setError(null);
              }}
            >
              ← Back to sign in
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-2">
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
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button className="btn-primary mt-2" type="submit" disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="text-xs text-ink-faint mt-4">
              Don't have an account? Ask your head of department to create one for you.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
