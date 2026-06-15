import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { MemoryRouter } from "react-router-dom";

// Mock useAuth before importing Navbar
vi.mock("../../hooks/useAuth");

import { useAuth } from "../../hooks/useAuth";
import { Navbar } from "../Navbar";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function renderNavbar(): ReturnType<typeof render> {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>
  );
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
});

// ─── Navbar unit tests ────────────────────────────────────────────────────────
// Validates: Requirements 9.1

describe("Navbar", () => {
  it("renders a Logout button when context is authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: { id: 1, username: "alice", email: "alice@example.com" },
      setUser: vi.fn(),
      clearUser: vi.fn(),
    });

    renderNavbar();

    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  it("calls clearUser and navigates to /login when Logout is clicked", async () => {
    const clearUser = vi.fn();
    const user = userEvent.setup();

    vi.mocked(useAuth).mockReturnValue({
      status: "authenticated",
      user: { id: 1, username: "alice", email: "alice@example.com" },
      setUser: vi.fn(),
      clearUser,
    });

    renderNavbar();

    await user.click(screen.getByRole("button", { name: /logout/i }));

    expect(clearUser).toHaveBeenCalledTimes(1);
  });
});
