import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/**
 * Navbar — renders the application navigation bar with a visible "Logout"
 * button on all protected pages.
 *
 * On logout:
 *   1. Calls clearUser() to clear the AuthContext session state.
 *   2. Navigates to /login.
 */
export function Navbar(): React.JSX.Element {
  const { clearUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    clearUser();
    navigate("/login");
  };

  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid var(--border)",
        backgroundColor: "var(--bg)",
      }}
    >
      <button
        type="button"
        onClick={handleLogout}
        style={{
          padding: "0.4rem 1rem",
          borderRadius: "6px",
          border: "1px solid var(--border)",
          background: "transparent",
          color: "var(--text)",
          cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        Logout
      </button>
    </nav>
  );
}
