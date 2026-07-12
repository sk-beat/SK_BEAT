import { createContext } from "react";
import type { AuthContextValue, AppRole } from "./types";

export const roleStorageKey = "sk-role";
export const userStorageKey = "sk-username";

export const AuthContext = createContext<AuthContextValue | null>(null);

export function isAppRole(role: unknown): role is AppRole {
  return role === "admin" || role === "technician" || role === "faculty";
}
