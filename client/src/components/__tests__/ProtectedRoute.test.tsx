import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, screen } from "@testing-library/react";
import React from "react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

// Mock useAuth before importing ProtectedRoute so the module-level mock is in place
vi.mock("../../hooks/useAuth");

import { useAuth } from "../../hooks/useAuth";
import { ProtectedRoute } from "../ProtectedRoute";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * A helper component that renders its own location so we can inspect where
 * react-router-dom has navigated to.
 */
function LocationDisplay(): React.JSX.Element {
  const location = useLocation();
  return (
    <div>
      <span data-testid="pathname">{location.pathname}</span>
      <span data-testid="state">{JSON.stringify(location.state)}</span>
    </div>
  );
}

/**
 * Renders a ProtectedRoute at the given `initialPath`.
 *
 * Route structure:
 *   /login        → <LocationDisplay /> (login page stub)
 *   <initialPath> → ProtectedRoute → "Protected Content" (guarded page)
 *
 * When ProtectedRoute redirects to /login we'll end up at /login and
 * LocationDisplay will show us the final pathname and navigation state.
 */
function renderProtectedRoute(initialPath: string): ReturnType<typeof render> {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        {/* The login stub — renders location info so we can assert on it */}
        <Route path="/login" element={<LocationDisplay />} />
        {/* The protected route at the requested path */}
        <Route path={initialPath} element={<ProtectedRoute />}>
          <Route index element={<div>Protected Content</div>} />
        </Route>
        {/* Catch-all route also protected */}
        <Route path="*" element={<ProtectedRoute />}>
          <Route index element={<div>Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

// ─── Arbitraries ─────────────────────────────────────────────────────────────

/**
 * Generates a valid URL pathname: starts with '/', followed by 1–4
 * alphanumeric/hyphen/underscore segments joined by '/'.
 */
const arbitraryProtectedPath = fc
  .array(fc.stringMatching(/^[a-zA-Z0-9_-]{1,15}$/), {
    minLength: 1,
    maxLength: 4,
  })
  .map((segments) => "/" + segments.join("/"));

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Property 4 ──────────────────────────────────────────────────────────────
// Feature: react-client, Property 4: Protected routes redirect unauthenticated users

describe("Property 4: Protected routes redirect unauthenticated users", () => {
  /**
   * For any path in the set of protected routes, when rendered with an
   * unauthenticated AuthContext, the router shall redirect to /login.
   *
   * Validates: Requirements 4.3
   */
  it("redirects to /login for any protected path when status is unauthenticated", async () => {
    // Feature: react-client, Property 4: Protected routes redirect unauthenticated users
    await fc.assert(
      fc.asyncProperty(arbitraryProtectedPath, async (path) => {
        // Provide an unauthenticated auth context
        vi.mocked(useAuth).mockReturnValue({
          status: "unauthenticated",
          user: null,
          setUser: vi.fn(),
          clearUser: vi.fn(),
        });

        const { unmount } = renderProtectedRoute(path);

        // After render the ProtectedRoute should have redirected to /login.
        // The login stub renders a <span data-testid="pathname"> with the current path.
        const pathnameEl = screen.queryByTestId("pathname");
        expect(pathnameEl).not.toBeNull();
        expect(pathnameEl!.textContent).toBe("/login");

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Property 5 ──────────────────────────────────────────────────────────────
// Feature: react-client, Property 5: Redirect preserves original requested path

describe("Property 5: Redirect preserves original requested path", () => {
  /**
   * For any protected path that triggers a redirect to /login, the navigation
   * state passed to the /login route shall contain the original requested path
   * under `state.from.pathname`, enabling post-login redirect back to it.
   *
   * Validates: Requirements 4.4
   */
  it("passes the original pathname in navigation state when redirecting to /login", async () => {
    // Feature: react-client, Property 5: Redirect preserves original requested path
    await fc.assert(
      fc.asyncProperty(arbitraryProtectedPath, async (path) => {
        vi.mocked(useAuth).mockReturnValue({
          status: "unauthenticated",
          user: null,
          setUser: vi.fn(),
          clearUser: vi.fn(),
        });

        const { unmount } = renderProtectedRoute(path);

        // The login stub renders location.state as JSON in data-testid="state"
        const stateEl = screen.queryByTestId("state");
        expect(stateEl).not.toBeNull();

        const state = JSON.parse(stateEl!.textContent ?? "null");
        // The navigation state must contain { from: { pathname: <original path> } }
        expect(state).not.toBeNull();
        expect(state.from).toBeDefined();
        expect(state.from.pathname).toBe(path);

        unmount();
      }),
      { numRuns: 100 }
    );
  });
});
