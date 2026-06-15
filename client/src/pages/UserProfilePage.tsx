import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import { ConfirmDialog } from "../components/ConfirmDialog";
import type { UserRow, UpdateUserPayload } from "../types/api.types";

/**
 * UserProfilePage — displays a single user's profile.
 *
 * Behaviour:
 * - Loads the user via GET /user/:id on mount, parsing the JSON-stringified
 *   array from `response.message` until the server normalises its shape.
 * - Shows an edit form (PATCH) only when the viewer is looking at their own profile.
 * - Shows a "Delete User" button only for Admins viewing another user's profile.
 * - Shows <ConfirmDialog /> before sending the DELETE request.
 * - Handles 400 / 403 / 404 / 500 with inline <ErrorMessage />; 401 is handled
 *   globally by apiClient (dispatches CLEAR_USER → redirect to /login).
 */
export function UserProfilePage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // ── Profile load state ──────────────────────────────────────────────────────
  const [profileUser, setProfileUser] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Edit-form state ─────────────────────────────────────────────────────────
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  // ── Delete state ────────────────────────────────────────────────────────────
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ── Fetch user on mount / id change ────────────────────────────────────────
  useEffect(() => {
    if (!id) {
      setError("User not found or invalid ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchUser() {
      setLoading(true);
      setError(null);

      const response = await userService.getById(id as string);

      if (cancelled) return;

      // The raw JSON the server actually sends is not wrapped in the
      // ApiResponse<T> shape for GET /user/:id — it returns the response body
      // directly. Cast to unknown so we can inspect the real shape.
      const raw = response as unknown as {
        success: boolean;
        message?: string;
        status?: number;
      };

      if (raw.success === false) {
        // Determine error message by inspecting status / message hints.
        const msg = raw.message ?? "";
        if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("incorrect")) {
          setError("User not found or invalid ID.");
        } else if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("permission")) {
          setError("You do not have permission to perform this action.");
        } else {
          setError("Failed to load user. Please try again.");
        }
        setLoading(false);
        return;
      }

      // Parse user data from the message field:
      // Server returns: { success: true, message: "User : [{...}]" }
      const match = raw.message?.match(/\[.*\]/s);
      const users = match ? (JSON.parse(match[0]) as UserRow[]) : [];
      const user = users[0] ?? null;

      if (!user) {
        setError("User not found.");
        setLoading(false);
        return;
      }

      setProfileUser(user);
      setEditUsername(user.username);
      setEditEmail(user.email);
      setLoading(false);
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, [id]);

  // ── Derived flags ───────────────────────────────────────────────────────────
  const isOwnProfile = authUser !== null && profileUser !== null && authUser.id === profileUser.id;
  const isAdmin = authUser?.role === "Admin";
  const canDelete = isAdmin && !isOwnProfile && profileUser !== null;

  // ── Edit-form submit ────────────────────────────────────────────────────────
  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profileUser || !id) return;

    setUpdateError(null);
    setUpdateSuccess(false);

    // Send only changed fields
    const payload: UpdateUserPayload = {};
    if (editUsername !== profileUser.username) payload.username = editUsername;
    if (editEmail !== profileUser.email) payload.email = editEmail;

    if (Object.keys(payload).length === 0) {
      setUpdateError("No changes detected. Please update at least one field.");
      return;
    }

    setUpdateLoading(true);

    const response = await userService.update(id, payload);
    const raw = response as unknown as {
      success: boolean;
      message?: string;
      user?: UserRow;
    };

    setUpdateLoading(false);

    if (raw.success) {
      // Use the returned user object if available, otherwise merge locally
      const updated: UserRow = raw.user ?? { ...profileUser, ...payload };
      setProfileUser(updated);
      setEditUsername(updated.username);
      setEditEmail(updated.email);
      setUpdateSuccess(true);
    } else {
      const msg = raw.message ?? "";
      if (msg.toLowerCase().includes("no fields")) {
        setUpdateError("Please provide at least one field to update.");
      } else if (msg.toLowerCase().includes("500") || msg.toLowerCase().includes("server")) {
        setUpdateError("Failed to update profile. Please try again.");
      } else {
        // Generic fallback — covers 400 without a specific message
        setUpdateError(msg || "Failed to update profile. Please try again.");
      }
    }
  }

  // ── Delete confirm ───────────────────────────────────────────────────────────
  async function handleDeleteConfirm() {
    if (!id) return;
    setDeleteError(null);
    setDeleteLoading(true);

    const response = await userService.delete(id);
    const raw = response as unknown as { success: boolean; message?: string };

    setDeleteLoading(false);

    if (raw.success) {
      navigate("/dashboard");
    } else {
      setShowConfirm(false);
      const msg = raw.message ?? "";
      if (msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("not found")) {
        setDeleteError("User not found or invalid ID.");
      } else if (msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("permission")) {
        setDeleteError("You do not have permission to perform this action.");
      } else {
        setDeleteError("Failed to delete user. Please try again.");
      }
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────
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

  if (!profileUser) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <ErrorMessage message="User not found." />
      </div>
    );
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: "600px" }}>
      <h1 style={{ marginBottom: "1.25rem", fontSize: "1.5rem", fontWeight: 600 }}>
        User Profile
      </h1>

      {/* ── Profile details ──────────────────────────────────────────────── */}
      <section
        aria-label="Profile details"
        style={{
          padding: "1.25rem",
          borderRadius: "8px",
          border: "1px solid var(--border, #e5e7eb)",
          backgroundColor: "var(--surface, #ffffff)",
          marginBottom: "1.5rem",
        }}
      >
        <dl style={{ margin: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <dt style={{ fontWeight: 600, minWidth: "110px", color: "var(--text-h, #111)" }}>
              Username
            </dt>
            <dd data-testid="profile-username" style={{ margin: 0, color: "var(--text, #374151)" }}>
              {profileUser.username}
            </dd>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <dt style={{ fontWeight: 600, minWidth: "110px", color: "var(--text-h, #111)" }}>
              Email
            </dt>
            <dd data-testid="profile-email" style={{ margin: 0, color: "var(--text, #374151)" }}>
              {profileUser.email}
            </dd>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <dt style={{ fontWeight: 600, minWidth: "110px", color: "var(--text-h, #111)" }}>
              Member since
            </dt>
            <dd data-testid="profile-created-at" style={{ margin: 0, color: "var(--text, #374151)" }}>
              {new Date(profileUser.created_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </section>

      {/* ── Edit form (own profile only) ─────────────────────────────────── */}
      {isOwnProfile && (
        <section
          aria-label="Edit profile"
          style={{
            padding: "1.25rem",
            borderRadius: "8px",
            border: "1px solid var(--border, #e5e7eb)",
            backgroundColor: "var(--surface, #ffffff)",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 600 }}>
            Edit Profile
          </h2>
          <form onSubmit={(e) => void handleUpdate(e)} noValidate>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="edit-username" style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                  Username
                </label>
                <input
                  id="edit-username"
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  disabled={updateLoading}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border, #e5e7eb)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                <label htmlFor="edit-email" style={{ fontWeight: 500, fontSize: "0.9rem" }}>
                  Email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  disabled={updateLoading}
                  style={{
                    padding: "0.5rem 0.75rem",
                    borderRadius: "6px",
                    border: "1px solid var(--border, #e5e7eb)",
                    fontSize: "0.95rem",
                  }}
                />
              </div>

              {updateError && <ErrorMessage message={updateError} />}
              {updateSuccess && (
                <p
                  role="status"
                  style={{ color: "#16a34a", fontSize: "0.9rem", margin: 0 }}
                >
                  Profile updated successfully.
                </p>
              )}

              <button
                type="submit"
                disabled={updateLoading}
                style={{
                  alignSelf: "flex-start",
                  padding: "0.5rem 1.25rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "var(--accent, #2563eb)",
                  color: "#fff",
                  fontWeight: 500,
                  cursor: updateLoading ? "not-allowed" : "pointer",
                  opacity: updateLoading ? 0.7 : 1,
                  fontSize: "0.95rem",
                }}
              >
                {updateLoading ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Delete section (Admin only, other user's profile) ────────────── */}
      {canDelete && (
        <section
          aria-label="Delete user"
          style={{
            padding: "1.25rem",
            borderRadius: "8px",
            border: "1px solid #fca5a5",
            backgroundColor: "rgba(254, 202, 202, 0.15)",
          }}
        >
          <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.1rem", fontWeight: 600, color: "#dc2626" }}>
            Danger Zone
          </h2>
          <p style={{ margin: "0 0 1rem", fontSize: "0.9rem", color: "var(--text, #374151)" }}>
            Permanently delete this user. This action cannot be undone.
          </p>

          {deleteError && (
            <div style={{ marginBottom: "0.75rem" }}>
              <ErrorMessage message={deleteError} />
            </div>
          )}

          <button
            type="button"
            disabled={deleteLoading}
            onClick={() => setShowConfirm(true)}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "6px",
              border: "1px solid #dc2626",
              backgroundColor: "transparent",
              color: "#dc2626",
              fontWeight: 500,
              cursor: deleteLoading ? "not-allowed" : "pointer",
              opacity: deleteLoading ? 0.7 : 1,
              fontSize: "0.95rem",
            }}
          >
            {deleteLoading ? "Deleting…" : "Delete User"}
          </button>
        </section>
      )}

      {/* ── Confirm dialog ───────────────────────────────────────────────── */}
      {showConfirm && (
        <ConfirmDialog
          message={`Are you sure you want to delete "${profileUser.username}"? This action cannot be undone.`}
          onConfirm={() => void handleDeleteConfirm()}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </main>
  );
}

export default UserProfilePage;
