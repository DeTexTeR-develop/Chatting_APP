import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter, Routes, Route } from "react-router-dom";

// Mock service and hook modules before importing the component under test
vi.mock("../../services/authService");
vi.mock("../../services/userService");
vi.mock("../../hooks/useAuth");

import { authService } from "../../services/authService";
import { userService } from "../../services/userService";
import { useAuth } from "../../hooks/useAuth";
import { LoginPage } from "../LoginPage";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockSetUser = vi.fn();
const mockClearUser = vi.fn();

/** Renders LoginPage inside a MemoryRouter with a /dashboard stub. */
function renderLoginPage(initialEntry = "/login") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
        <Route path="/signup" element={<div data-testid="signup">Signup</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();

  // Default: auth status is "unauthenticated" (user is not yet logged in)
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

describe("LoginPage — form structure", () => {
  it("renders email and password fields and a submit button", () => {
    renderLoginPage();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
  });

  it("renders a link to the signup page", () => {
    renderLoginPage();

    const link = screen.getByRole("link", { name: /sign up/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/signup");
  });
});

// ─── 401 error ───────────────────────────────────────────────────────────────

describe("LoginPage — 401 error handling (Requirements 1.5)", () => {
  it('shows "Invalid credentials" error when server returns 401', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      success: false,
      message: "Invalid Credentials",
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "wrongpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/invalid credentials\. please try again\./i)
      ).toBeInTheDocument();
    });
  });
});

// ─── 500 error ───────────────────────────────────────────────────────────────

describe("LoginPage — 500 error handling (Requirements 1.6)", () => {
  it('shows "Something went wrong" error when server returns 500', async () => {
    vi.mocked(authService.login).mockResolvedValue({
      success: false,
      message: "Internal Server Error",
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "somepass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong\. please try again later\./i)
      ).toBeInTheDocument();
    });
  });

  it("shows generic error when the promise rejects (network error)", async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error("Network Error"));

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "somepass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/something went wrong\. please try again later\./i)
      ).toBeInTheDocument();
    });
  });
});

// ─── Loading state ────────────────────────────────────────────────────────────

describe("LoginPage — loading state (Requirements 1.7)", () => {
  it("disables the submit button and shows loading text while request is in-flight", async () => {
    // Keep the promise pending so we can inspect mid-flight state
    let resolveLogin!: (value: { success: boolean; message: string }) => void;
    vi.mocked(authService.login).mockReturnValue(
      new Promise((res) => {
        resolveLogin = res;
      })
    );

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "somepass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    // While in-flight the button should be disabled
    const button = screen.getByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();

    // Resolve to clean up
    resolveLogin({ success: false, message: "Invalid Credentials" });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /sign in/i })).not.toBeDisabled();
    });
  });
});

// ─── Success — navigate to dashboard ─────────────────────────────────────────

describe("LoginPage — successful login (Requirements 1.4)", () => {
  it("calls setUser and navigates to /dashboard on successful login", async () => {
    vi.mocked(authService.login).mockResolvedValue({
      success: true,
      message: "User Logged In Successfully!!!",
    });

    vi.mocked(userService.getMe).mockResolvedValue({
      success: true,
      data: {
        users: [
          {
            id: 1,
            username: "testuser",
            email: "test@example.com",
            role: "User",
            created_at: "2024-01-01T00:00:00.000Z",
          },
        ],
      },
    });

    renderLoginPage();

    await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
    await userEvent.type(screen.getByLabelText(/password/i), "validpass");
    await userEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByTestId("dashboard")).toBeInTheDocument();
    });

    expect(mockSetUser).toHaveBeenCalledWith({
      id: 1,
      username: "testuser",
      email: "test@example.com",
      role: "User",
    });
  });
});
