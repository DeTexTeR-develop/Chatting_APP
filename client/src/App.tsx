import React, { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PublicOnlyRoute } from "./components/PublicOnlyRoute";
import { Navbar } from "./components/Navbar";
import { useAuth } from "./hooks/useAuth";
import socket from "./socket";

import { LoginPage } from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import { DashboardPage } from "./pages/DashboardPage";
import UserProfilePage from "./pages/UserProfilePage";
import { ConversationsPage } from "./pages/ConversationsPage";
import { ChatPage } from "./pages/ChatPage";

/**
 * SocketManager — connects/disconnects the socket based on auth state.
 * Must be rendered inside AuthProvider so it can read the session.
 */
function SocketManager(): null {
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      // Connect when logged in
      if (!socket.connected) socket.connect();
    } else if (status === "unauthenticated") {
      // Disconnect when logged out
      if (socket.connected) socket.disconnect();
    }
  }, [status]);

  return null;
}

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
      <SocketManager />
      <Routes>
        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/conversations" replace />} />

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
            <Route path="/conversations" element={<ConversationsPage />} />
            <Route path="/chat/:id" element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
