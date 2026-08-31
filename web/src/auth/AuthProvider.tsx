import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { api } from "../lib/api";
import type { User } from "../lib/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  devLoginEnabled: boolean;
  azureConfigured: boolean;
  refresh: () => Promise<void>;
  devSignIn: (name: string, email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [devLoginEnabled, setDevLoginEnabled] = useState(false);
  const [azureConfigured, setAzureConfigured] = useState(true);

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
    api
      .get<{ azureConfigured: boolean; devLoginEnabled: boolean }>("/auth/config")
      .then((cfg) => {
        setAzureConfigured(cfg.azureConfigured);
        setDevLoginEnabled(cfg.devLoginEnabled);
      })
      .catch(() => {});
  }, []);

  async function devSignIn(name: string, email: string) {
    try {
      const me = await api.post<User>("/auth/dev-login", { name, email });
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
    <AuthContext.Provider value={{ user, loading, devLoginEnabled, azureConfigured, refresh, devSignIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
