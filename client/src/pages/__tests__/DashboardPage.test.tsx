import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Mock service and hook before importing components
vi.mock("../../services/userService");
vi.mock("../../hooks/useAuth");

import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { DashboardPage } from "../DashboardPage";
import type { UserRow } from "../../types/api.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderDashboard(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>
  );
}

// ─── Setup / Teardown ────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();

  // Default: useAuth returns authenticated user (for child components that may need it)
  vi.mocked(useAuth).mockReturnValue({
    status: "authenticated",
    user: { id: 1, username: "me", email: "me@test.com" },
    setUser: vi.fn(),
    clearUser: vi.fn(),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Property 6 ──────────────────────────────────────────────────────────────
// Feature: react-client, Property 6: All users in list are rendered

describe("Property 6: All users in list are rendered", () => {
  /**
   * For any array of user objects returned by GET /user, every user's username
   * and email shall appear in the rendered Dashboard output — no users shall
   * be silently dropped.
   *
   * Validates: Requirements 5.3
   */
  it("every user returned by getAll appears in the rendered dashboard", async () => {
    // Feature: react-client, Property 6: All users in list are rendered
    await fc.assert(
      fc.asyncProperty(
        fc
          .array(
            fc.record({
              id: fc.integer({ min: 1, max: 100_000 }),
              username: fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,14}$/),
              email: fc.emailAddress(),
              // Use a fixed valid ISO string — created_at content is not rendered,
              // so its value doesn't affect the property under test.
              created_at: fc.constant("2024-01-01T00:00:00.000Z"),
            }),
            { minLength: 1, maxLength: 10 }
          )
          // Ensure unique IDs so React keys are stable within each run
          .filter(
            (arr) => new Set(arr.map((u) => u.id)).size === arr.length
          ),
        async (users: UserRow[]) => {
          vi.mocked(userService.getAll).mockResolvedValue({
            success: true,
            users,
          } as unknown as ReturnType<typeof userService.getAll> extends Promise<infer R>
            ? R
            : never);

          const { unmount } = renderDashboard();

          // Wait for loading to finish and users to render
          await waitFor(() => {
            expect(screen.queryByRole("status")).not.toBeInTheDocument();
          });

          for (const user of users) {
            expect(screen.getByText(user.username)).toBeInTheDocument();
            expect(screen.getByText(user.email)).toBeInTheDocument();
          }

          unmount();
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe("DashboardPage unit tests", () => {
  it("shows loading spinner (role=status) during fetch before getAll resolves", async () => {
    // Never resolves — keeps the component in loading state
    vi.mocked(userService.getAll).mockReturnValue(new Promise(() => {}));

    renderDashboard();

    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows error message when getAll returns success: false", async () => {
    vi.mocked(userService.getAll).mockResolvedValue({
      success: false,
    } as unknown as ReturnType<typeof userService.getAll> extends Promise<infer R>
      ? R
      : never);

    renderDashboard();

    await screen.findByText("Failed to load users. Please refresh the page.");
  });

  it("shows users list when getAll returns success: true with users", async () => {
    const users: UserRow[] = [
      { id: 1, username: "alice", email: "alice@example.com", created_at: "2024-01-01T00:00:00.000Z" },
      { id: 2, username: "bob", email: "bob@example.com", created_at: "2024-01-02T00:00:00.000Z" },
    ];

    vi.mocked(userService.getAll).mockResolvedValue({
      success: true,
      users,
    } as unknown as ReturnType<typeof userService.getAll> extends Promise<infer R>
      ? R
      : never);

    renderDashboard();

    await screen.findByText("alice");
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    await screen.findByText("bob");
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });
});
