import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "./LoadingSpinner";

/**
 * PublicOnlyRoute guards routes that should only be accessible to
 * unauthenticated users (e.g. /login and /signup).
 *
 * - While status === "loading": renders <LoadingSpinner /> to wait for the
 *   session check before deciding whether to redirect, preventing a spurious
 *   redirect to /dashboard while the session is still being verified.
 * - While status === "authenticated": redirects to /dashboard.
 * - While status === "unauthenticated": renders <Outlet /> (the nested route).
 */
export function PublicOnlyRoute(): React.JSX.Element {
  const { status } = useAuth();

  if (status === "loading") {
    return <LoadingSpinner />;
  }

  if (status === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  // status === "unauthenticated"
  return <Outlet />;
}
