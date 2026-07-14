import type { ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import { Navigate } from "react-router-dom";

export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated && role) {
    if (role === "admin") {
      return <Navigate to="/dashboard" replace />;
    }

    if (role === "kabataan") {
      return <Navigate to="/youth" replace />;
    }
  }

  return children;
}