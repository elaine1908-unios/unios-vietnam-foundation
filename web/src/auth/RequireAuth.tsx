import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ForceChangePasswordPage } from "../pages/ForceChangePasswordPage";
import { ForceSetup2FAPage } from "../pages/ForceSetup2FAPage";
import type { Capability } from "../lib/types";

// The single wrapper every authenticated route passes through — which is
// exactly why the forced-password-change and forced-2FA-setup checks live
// here and nowhere else. A page nested inside this (e.g. via `cap`) never
// gets a chance to render while either is pending, without needing its own
// copy of these checks. Password comes first, same order the matching
// API-level gates enforce (forcePasswordChangeGate.ts, then
// force2faSetupGate.ts) — a fresh account's temp password isn't something
// to build a second factor on top of.
export function RequireAuth({ children, cap }: { children: ReactNode; cap?: Capability }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <ForceChangePasswordPage />;
  if (user.must_setup_2fa && !user.has_2fa) return <ForceSetup2FAPage />;
  if (cap && !user.capabilities.includes(cap)) return <Navigate to="/profiles" replace />;
  return <>{children}</>;
}
