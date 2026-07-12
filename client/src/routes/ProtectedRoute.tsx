import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth, type AppRole } from "../auth/useAuth";

type ProtectedRouteProps = {
  children: ReactNode;
  allowedRoles: readonly AppRole[];
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.some((allowedRole) => allowedRole === role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated && role) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
