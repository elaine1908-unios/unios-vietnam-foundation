import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../lib/types";

// Either a completed sign-in (no error), a validation/auth error, or a
// "password was correct, now enter your 2FA code" step — LoginPage.tsx
// switches its form based on which of these comes back.
type SignInResult = { error: string | null; requires2fa?: false } | { error: null; requires2fa: true; tempToken: string };

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  completeTwoFactor: (tempToken: string, code: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const me = await api.get<User>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function signIn(email: string, password: string): Promise<SignInResult> {
    try {
      const result = await api.post<User | { requires2fa: true; temp_token: string }>("/auth/login", { email, password });
      if ("requires2fa" in result) {
        return { error: null, requires2fa: true, tempToken: result.temp_token };
      }
      setUser(result);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Something went wrong." };
    }
  }

  async function completeTwoFactor(tempToken: string, code: string) {
    try {
      const me = await api.post<User>("/auth/login/2fa", { temp_token: tempToken, code });
      setUser(me);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Something went wrong." };
    }
  }

  async function signOut() {
    await api.post("/auth/logout");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, refresh, signIn, completeTwoFactor, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
