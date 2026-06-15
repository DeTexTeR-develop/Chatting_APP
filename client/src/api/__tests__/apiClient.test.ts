import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import request from "../apiClient";

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Property 3 ──────────────────────────────────────────────────────────────
// Feature: react-client, Property 3: All requests include credentials

describe("Property 3: All requests include credentials", () => {
  it("every request call passes credentials: include to fetch regardless of path or method", async () => {
    // Validates: Requirements 3.6, 10.1
    await fc.assert(
      fc.asyncProperty(
        // Generate arbitrary URL paths (non-empty string segments, joined with /)
        fc.array(fc.stringMatching(/^[a-zA-Z0-9_-]{1,10}$/), {
          minLength: 1,
          maxLength: 4,
        }).map((parts) => "/" + parts.join("/")),
        // Generate arbitrary HTTP methods
        fc.constantFrom("GET", "POST", "PUT", "PATCH", "DELETE"),
        async (path, method) => {
          const mockFetch = vi.fn().mockResolvedValue(
            new Response(JSON.stringify({ success: true }), {
              status: 200,
              headers: { "Content-Type": "application/json" },
            })
          );
          vi.stubGlobal("fetch", mockFetch);

          await request(path, { method });

          expect(mockFetch).toHaveBeenCalledOnce();
          const [, fetchOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
          expect(fetchOptions.credentials).toBe("include");
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ─── Property 11 ─────────────────────────────────────────────────────────────
// Feature: react-client, Property 11: Network errors produce consistent user-facing message

const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Please check your connection.";

describe("Property 11: Network errors produce consistent user-facing message", () => {
  it("returns the standard message for any network-level error thrown by fetch", async () => {
    // Validates: Requirements 10.4
    await fc.assert(
      fc.asyncProperty(
        // Generate various kinds of thrown values: Error, TypeError, plain strings, objects
        fc.oneof(
          fc.string().map((msg) => new Error(msg)),
          fc.string().map((msg) => new TypeError(msg)),
          fc.string(),
          fc.integer().map((code) => new Error(`ECONNREFUSED ${code}`)),
          fc.constant(new Error("net::ERR_NAME_NOT_RESOLVED")),
          fc.constant(new Error("Failed to fetch")),
        ),
        // Also vary the path so we confirm the message is endpoint-independent
        fc.array(fc.stringMatching(/^[a-zA-Z0-9_-]{1,10}$/), {
          minLength: 1,
          maxLength: 3,
        }).map((parts) => "/" + parts.join("/")),
        async (thrownValue, path) => {
          const mockFetch = vi.fn().mockRejectedValue(thrownValue);
          vi.stubGlobal("fetch", mockFetch);

          const result = await request(path);

          expect(result.success).toBe(false);
          expect(result.message).toBe(NETWORK_ERROR_MESSAGE);
        }
      ),
      { numRuns: 100 }
    );
  });
});
