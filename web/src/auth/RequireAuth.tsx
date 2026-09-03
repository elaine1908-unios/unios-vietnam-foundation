import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { ForceChangePasswordPage } from "../pages/ForceChangePasswordPage";
import type { Capability } from "../lib/types";

// The single wrapper every authenticated route passes through — which is
// exactly why the forced-password-change check lives here and nowhere else.
// A page nested inside this (e.g. via `cap`) never gets a chance to render
// while must_change_password is true, without needing its own copy of this
// check.
export function RequireAuth({ children, cap }: { children: ReactNode; cap?: Capability }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.must_change_password) return <ForceChangePasswordPage />;
  if (cap && !user.capabilities.includes(cap)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
