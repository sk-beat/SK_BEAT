import { Navigate } from "react-router-dom";
import { type ReactNode } from "react";
import { useAuth } from "../auth/useAuth";

type PublicRouteProps = {
  children: ReactNode;
};

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, role } = useAuth();

  if (isAuthenticated) {
    switch (role) {
      case "admin":
        return <Navigate to="/dashboard" replace />;

      case "kabataan":
        return <Navigate to="/youth" replace />;

      default:
        return <Navigate to="/" replace />;
    }
  }

  return children;
}