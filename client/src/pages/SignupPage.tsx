import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { useAuth } from "../hooks/useAuth";
import { ErrorMessage } from "../components/ErrorMessage";
import type { SignupPayload } from "../types/api.types";

/**
 * SignupPage — public page for new user registration.
 *
 * On success (200): navigates to /login.
 * On 409 (user already exists): shows "An account with this email already exists."
 * On 400 (validation error): shows the server's validation message or a generic one.
 * On 500 / other: shows "Something went wrong. Please try again later."
 */
export default function SignupPage(): React.JSX.Element {
  const navigate = useNavigate();
  // useAuth is available in context; used here to detect authenticated state
  // via PublicOnlyRoute guard, but we still import it per task spec.
  useAuth();

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Derive an error message from the API response.
   *
   * Since apiClient returns parsed JSON without the HTTP status code,
   * we infer the error category from the message content:
   *  - "already exists"  → 409 conflict
   *  - validation errors → 400 bad request
   *  - anything else     → 500 / unknown
   */
  function deriveError(success: boolean, message?: string): string {
    if (success) return "";

    const msg = message ?? "";

    if (msg.toLowerCase().includes("already exists")) {
      return "An account with this email already exists.";
    }

    if (
      msg.toLowerCase().includes("validation") ||
      msg.toLowerCase().includes("required") ||
      msg.toLowerCase().includes("min") ||
      msg.toLowerCase().includes("invalid") ||
      msg.toLowerCase().includes("username") ||
      msg.toLowerCase().includes("email") ||
      msg.toLowerCase().includes("password")
    ) {
      // Prefer the server's descriptive message; fall back to generic 400 text.
      return (
        msg ||
        "Please provide valid username (min 3 chars), email, and password (min 6 chars)."
      );
    }

    return "Something went wrong. Please try again later.";
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload: SignupPayload = { username, email, password };

    try {
      const response = await authService.signup(payload);

      if (response.success) {
        navigate("/login");
        return;
      }

      setError(deriveError(response.success, response.message));
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          backgroundColor: "#ffffff",
          boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
        }}
      >
        <h1 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 600 }}>
          Create an account
        </h1>

        {error && (
          <div style={{ marginBottom: "1rem" }}>
            <ErrorMessage message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="username"
              style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500 }}
            >
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label
              htmlFor="password"
              style={{ display: "block", marginBottom: "0.4rem", fontWeight: 500 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                fontSize: "1rem",
                boxSizing: "border-box",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "0.6rem 1rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: loading ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>

        <p style={{ marginTop: "1.25rem", fontSize: "0.9rem", textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#2563eb" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
