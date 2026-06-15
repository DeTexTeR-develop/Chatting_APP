import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { authService } from "../authService";

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Property 1 ──────────────────────────────────────────────────────────────
// Feature: react-client, Property 1: Auth service request passthrough

describe("Property 1: Auth service request passthrough", () => {
  /**
   * For any valid login credentials { email, password }, authService.login()
   * shall send exactly those values in the HTTP request body — no fields added,
   * no fields omitted, no values transformed.
   *
   * Validates: Requirements 1.3, 2.3
   */
  it("login sends exact credentials in request body with correct URL path", async () => {
    // Feature: react-client, Property 1: Auth service request passthrough
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6 }),
        }),
        async ({ email, password }) => {
          const mockFetch = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
          vi.stubGlobal("fetch", mockFetch);

          await authService.login({ email, password });

          expect(mockFetch).toHaveBeenCalledOnce();
          const [calledUrl, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit,
          ];

          // Assert the correct URL path
          expect(calledUrl).toMatch(/\/auth\/login$/);

          // Assert the request body contains exactly { email, password }
          const body = JSON.parse(fetchOptions.body as string) as unknown;
          expect(body).toEqual({ email, password });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * For any valid signup credentials { username, email, password }, authService.signup()
   * shall send exactly those values in the HTTP request body — no fields added,
   * no fields omitted, no values transformed.
   *
   * Validates: Requirements 1.3, 2.3
   */
  it("signup sends exact credentials in request body with correct URL path", async () => {
    // Feature: react-client, Property 1: Auth service request passthrough
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 3 }),
          email: fc.emailAddress(),
          password: fc.string({ minLength: 6 }),
        }),
        async ({ username, email, password }) => {
          const mockFetch = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
          vi.stubGlobal("fetch", mockFetch);

          await authService.signup({ username, email, password });

          expect(mockFetch).toHaveBeenCalledOnce();
          const [calledUrl, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit,
          ];

          // Assert the correct URL path
          expect(calledUrl).toMatch(/\/auth\/signup$/);

          // Assert the request body contains exactly { username, email, password }
          const body = JSON.parse(fetchOptions.body as string) as unknown;
          expect(body).toEqual({ username, email, password });
        }
      ),
      { numRuns: 100 }
    );
  });
});
