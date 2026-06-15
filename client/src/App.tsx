import React from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Navbar } from "./components/Navbar";

import { LoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import UserProfilePage from "./pages/UserProfilePage";

/**
 * App — root component.
 *
 * Wraps the entire tree in <AuthProvider> so every descendant has access to
 * the session state.  The route table mirrors the design document:
 *
 *   /               → redirect to /dashboard
 *   /login          → LoginPage  (PublicOnlyRoute — redirects authed users)
 *   /signup         → SignupPage (PublicOnlyRoute — redirects authed users)
 *   /dashboard      → DashboardPage   (ProtectedRoute + Navbar)
 *   /users/:id      → UserProfilePage (ProtectedRoute + Navbar)
 */
export default function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Public-only routes (redirect to /dashboard when authenticated) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        {/* Protected routes (redirect to /login when unauthenticated) */}
        <Route element={<ProtectedRoute />}>
          {/* Layout route that renders Navbar above every protected page */}
          <Route
            element={
              <>
                <Navbar />
                <Outlet />
              </>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/users/:id" element={<UserProfilePage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
