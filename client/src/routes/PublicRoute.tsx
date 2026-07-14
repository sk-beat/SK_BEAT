import type { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import { Navigate } from "react-router-dom";

export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
