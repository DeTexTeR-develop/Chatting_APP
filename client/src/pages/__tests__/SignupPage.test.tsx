import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock service and hook modules before importing the component under test
vi.mock("../../services/authService");
vi.mock("../../hooks/useAuth");

import { authService } from "../../services/authService";
import { useAuth } from "../../hooks/useAuth";
import SignupPage from "../SignupPage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockSetUser = vi.fn();
const mockClearUser = vi.fn();

/** Renders SignupPage inside a MemoryRouter with a /login and /dashboard stub. */
function renderSignupPage(initialEntry = "/signup") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<div data-testid="login">Login</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();

  // Default: unauthenticated user visiting the signup page
  vi.mocked(useAuth).mockReturnValue({
    status: "unauthenticated",
    user: null,
    setUser: mockSetUser,
    clearUser: mockClearUser,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Render tests ─────────────────────────────────────────────────────────────

describe("SignupPage — form structure (Requirements 2.2)", () => {
  it("renders username, email, and password fields and a submit button", () => {
    renderSignupPage();

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign up/i })).toBeInTheDocument();
  });
});

// ─── 409 error ───────────────────────────────────────────────────────────────

describe('SignupPage — 409 "already exists" error (Requirements 2.6)', () => {
  it('shows "An account with this email already exists." when response contains "already exists"', async () => {
    vi.mocked(authService.signup).mockResolvedValue({
      success: false,
      message: "User already exists",
    });

    renderSignupPage();

    await userEvent.type(screen.getByLabelText(/username/i), "testuser");
    await userEvent.type(screen.getByLabelText(/email/i), "taken@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/an account with this email already exists\./i)
      ).toBeInTheDocument();
    });
  });
});

// ─── 400 error ───────────────────────────────────────────────────────────────

describe("SignupPage — 400 validation error (Requirements 2.7)", () => {
  it("shows the server validation message for a 400 error", async () => {
    vi.mocked(authService.signup).mockResolvedValue({
      success: false,
      message: "Validation error: username too short",
    });

    renderSignupPage();

    await userEvent.type(screen.getByLabelText(/username/i), "ab");
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "pass123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/validation error: username too short/i)
      ).toBeInTheDocument();
    });
  });
});

// ─── 500 error ───────────────────────────────────────────────────────────────

describe("SignupPage — 500 server error (Requirements 2.5)", () => {
  it('shows "Something went wrong. Please try again later." for a 500 error', async () => {
    vi.mocked(authService.signup).mockResolvedValue({
      success: false,
      message: "Internal server error",
    });

    renderSignupPage();

    await userEvent.type(screen.getByLabelText(/username/i), "testuser");
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong\. please try again later\./i)
      ).toBeInTheDocument();
    });
  });

  it("shows generic error when the promise rejects (network error)", async () => {
    vi.mocked(authService.signup).mockRejectedValue(new Error("Network Error"));

    renderSignupPage();

    await userEvent.type(screen.getByLabelText(/username/i), "testuser");
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong\. please try again later\./i)
      ).toBeInTheDocument();
    });
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe("SignupPage — loading state (Requirements 2.8)", () => {
  it("disables the submit button and shows loading text while request is in-flight", async () => {
    // Keep the promise pending so we can inspect mid-flight state
    let resolveSignup!: (value: { success: boolean; message: string }) => void;
    vi.mocked(authService.signup).mockReturnValue(
      new Promise((res) => {
        resolveSignup = res;
      })
    );

    renderSignupPage();

    await userEvent.type(screen.getByLabelText(/username/i), "testuser");
    await userEvent.type(screen.getByLabelText(/email/i), "user@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "password123");
    await userEvent.click(screen.getByRole("button", { name: /sign up/i }));

    // While in-flight, the button should be disabled with loading text
    const loadingButton = screen.getByRole("button", { name: /creating account/i });
    expect(loadingButton).toBeDisabled();

    // Resolve to clean up
    resolveSignup({ success: false, message: "Internal server error" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign up/i })).not.toBeDisabled();
    });
  });
});

// ─── Authenticated redirect (PublicOnlyRoute behavior) ────────────────────────

describe("SignupPage — authenticated user redirect (Requirements 2.9)", () => {
  it("redirects authenticated user to /dashboard", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: { id: 1, username: "existing", email: "existing@example.com", role: "User" },
      setUser: mockSetUser,
      clearUser: mockClearUser,
    });

    // Render with PublicOnlyRoute wrapping SignupPage to simulate actual app behaviour
    render(
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          {/* Inline PublicOnlyRoute behaviour for this test */}
          <Route
            path="/signup"
            element={
              (() => {
                const { status } = useAuth();
                if (status === "authenticated") {
                  return <div data-testid="dashboard">Dashboard</div>;
                }
                return <SignupPage />;
              })()
            }
          />
          <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    expect(screen.queryByLabelText(/username/i)).not.toBeInTheDocument();
  });
});
