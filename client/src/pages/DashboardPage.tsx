import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { userService } from "../services/userService";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import type { UserRow } from "../types/api.types";

/**
 * DashboardPage — fetches and renders the list of all users.
 *
 * Behaviour:
 * - Shows <LoadingSpinner /> while the request is in-flight.
 * - Shows <ErrorMessage /> when the server returns 500 or any non-401 error.
 * - 401 responses are handled globally by apiClient (dispatches CLEAR_USER),
 *   so no extra handling is needed here.
 */
export function DashboardPage(): React.JSX.Element {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUsers() {
      setLoading(true);
      setError(null);

      const response = await userService.getAll();

      if (cancelled) return;

      // The backend sends { success: true, users: [...] } at the top level.
      // apiClient returns the raw parsed JSON, so `users` lives directly on
      // the response object — not nested under `data`.
      const raw = response as unknown as { success: boolean; users?: UserRow[] };

      if (raw.success && Array.isArray(raw.users)) {
        setUsers(raw.users);
      } else if (!raw.success) {
        setError("Failed to load users. Please refresh the page.");
      }

      setLoading(false);
    }

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <ErrorMessage message={error} />
      </div>
    );
  }

  return (
    <main style={{ padding: "1.5rem" }}>
      <h1 style={{ marginBottom: "1.25rem", fontSize: "1.5rem", fontWeight: 600 }}>
        Users
      </h1>
      {users.length === 0 ? (
        <p style={{ color: "var(--muted, #6b7280)" }}>No users found.</p>
      ) : (
        <ul
          style={{
            listStyle: "none",
            margin: 0,
            padding: 0,
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {users.map((user) => (
            <li
              key={user.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "6px",
                border: "1px solid var(--border, #e5e7eb)",
                backgroundColor: "var(--surface, #ffffff)",
              }}
            >
              <Link
                to={`/users/${user.id}`}
                style={{
                  fontWeight: 500,
                  textDecoration: "none",
                  color: "var(--accent, #2563eb)",
                }}
              >
                {user.username}
              </Link>
              <span style={{ color: "var(--muted, #6b7280)", fontSize: "0.9rem" }}>
                {user.email}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
