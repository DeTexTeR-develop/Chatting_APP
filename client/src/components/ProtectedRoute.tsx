import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * ProtectedRoute guards any route that requires an authenticated session.
 *
 * - While status === "loading": renders <LoadingSpinner /> to prevent a
 *   flash of unauthenticated content before the session check completes.
 * - While status === "unauthenticated": redirects to /login, preserving the
 *   originally requested path in navigation state so a post-login redirect is
 *   possible.
 * - While status === "authenticated": renders <Outlet /> (the nested route).
 */
export function ProtectedRoute(): React.JSX.Element {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // status === "authenticated"
  return <Outlet />;
}
