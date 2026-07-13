import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "../auth/useAuth";
import type { AppRole } from "../auth/types";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: readonly AppRole[];
};

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.some((allowedRole) => allowedRole === role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
