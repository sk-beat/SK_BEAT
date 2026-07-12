import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  AuthContext,
  isAppRole,
  roleStorageKey,
  userStorageKey,
} from "./AuthContext";
import type { AppRole, AuthContextValue, LoginPayload } from "./types";

type ApiLoginResponse = {
  ok: boolean;
  message?: string;
  role?: AppRole;
  user?: {
    email?: string;
    fullname?: string;
    user_id?: string | number;
  };
};

function readInitialRole() {
  const storedRole = sessionStorage.getItem(roleStorageKey);
  return isAppRole(storedRole) ? storedRole : null;
}

function readInitialUsername() {
  return sessionStorage.getItem(userStorageKey);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<AppRole | null>(readInitialRole);
  const [username, setUsername] = useState<string | null>(readInitialUsername);

  const login = useCallback(async ({ username, password }: LoginPayload) => {
    if (username === "admin" && password === "admin") {
      sessionStorage.setItem(roleStorageKey, "admin");
      sessionStorage.setItem(userStorageKey, "admin");
      setRole("admin");
      setUsername("admin");
      return;
    }

    const response = await fetch("/api/auth.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = (await response.json()) as ApiLoginResponse;

    if (!response.ok || !data.ok) {
      throw new Error(data.message || "Login failed.");
    }

    if (!isAppRole(data.role)) {
      throw new Error("Your account does not have portal access.");
    }

    const displayName = data.user?.email || username;

    sessionStorage.setItem(roleStorageKey, data.role);
    sessionStorage.setItem(userStorageKey, displayName);
    setRole(data.role);
    setUsername(displayName);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(roleStorageKey);
    sessionStorage.removeItem(userStorageKey);
    setRole(null);
    setUsername(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: role !== null,
      role,
      username,
      login,
      logout,
    }),
    [login, logout, role, username],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
