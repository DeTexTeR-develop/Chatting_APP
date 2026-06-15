import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authService } from "../services/authService";
import { userService } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { ErrorMessage } from "../components/ErrorMessage";

/**
 * LoginPage — controlled email/password form that authenticates users.
 *
 * Flow:
 *  1. User submits email + password.
 *  2. Calls authService.login() → POST /auth/login.
 *  3. On success (success: true): fetches current user via userService.getMe(),
 *     calls setUser(), then navigates to /dashboard.
 *  4. On 401: shows "Invalid credentials. Please try again."
 *  5. On 500 / unexpected: shows "Something went wrong. Please try again later."
 *  6. Disables submit button and shows loading indicator while request is in-flight.
 */
export function LoginPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { status, setUser } = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // While auth status is still being determined, don't redirect yet.
  // ProtectedRoute / PublicOnlyRoute will handle redirecting authenticated users.

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Prevent duplicate submissions
    if (loading) return;

    setError(null);
    setLoading(true);

    try {
      const loginResult = await authService.login({ email, password });

      if (loginResult.success) {
        // Login succeeded — fetch the current user's data to populate AuthContext
        const meResult = await userService.getMe();

        if (meResult.success && meResult.data && meResult.data.users.length > 0) {
          const currentUser = meResult.data.users[0];
          setUser({
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            role: currentUser.role,
          });
        }

        navigate("/dashboard");
      } else {
        // Determine error message based on what the server returned.
        // authService normalises HTTP errors but may still return success: false.
        // We check the HTTP status via the message field as a fallback.
        const msg = loginResult.message ?? "";

        if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("credentials")) {
          setError("Invalid credentials. Please try again.");
        } else {
          setError("Something went wrong. Please try again later.");
        }
      }
    } catch {
      setError("Something went wrong. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Determine whether the submit button should show a loading label
  const isSubmitting = loading || status === "loading";

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          padding: "2rem",
          borderRadius: "8px",
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ marginBottom: "1.5rem", fontSize: "1.5rem", fontWeight: 600 }}>
          Sign in
        </h1>

        {error && (
          <div style={{ marginBottom: "1rem" }}>
            <ErrorMessage message={error} />
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ marginBottom: "1rem" }}>
            <label
              htmlFor="email"
              style={{ display: "block", marginBottom: "0.375rem", fontWeight: 500 }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              style={{ display: "block", marginBottom: "0.375rem", fontWeight: 500 }}
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            disabled={isSubmitting}
            aria-busy={loading}
            style={{
              width: "100%",
              padding: "0.625rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: isSubmitting ? "#9ca3af" : "#2563eb",
              color: "#ffffff",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background-color 0.15s",
            }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.9rem" }}>
          Don&apos;t have an account?{" "}
          <Link to="/signup" style={{ color: "#2563eb" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
