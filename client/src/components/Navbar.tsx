import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Navbar(): React.JSX.Element {
  const { clearUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = (): void => {
    clearUser();
    navigate("/login");
  };

  const linkStyle: React.CSSProperties = {
    padding: "0.4rem 1rem",
    borderRadius: "6px",
    border: "1px solid #e5e7eb",
    background: "transparent",
    color: "#111827",
    cursor: "pointer",
    fontSize: "0.9rem",
    textDecoration: "none",
  };

  return (
    <nav
      aria-label="Main navigation"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0.75rem 1.5rem",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#fff",
      }}
    >
      {/* Left — nav links */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link to="/dashboard" style={linkStyle}>Users</Link>
        <Link to="/conversations" style={linkStyle}>💬 Chats</Link>
      </div>

      {/* Right — logout */}
      <button
        type="button"
        onClick={handleLogout}
        style={{
          padding: "0.4rem 1rem",
          borderRadius: "6px",
          border: "1px solid #e5e7eb",
          background: "transparent",
          color: "#111827",
          cursor: "pointer",
          fontSize: "0.9rem",
        }}
      >
        Logout
      </button>
    </nav>
  );
}
