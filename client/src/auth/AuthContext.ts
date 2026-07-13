import { createContext } from "react";
import type { AuthContextValue, AppRole } from "./types";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function isAppRole(role: unknown): role is AppRole {
  return role === "admin" || role === "kabataan";
}
