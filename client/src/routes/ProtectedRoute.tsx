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
  const { isAuthenticated, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}