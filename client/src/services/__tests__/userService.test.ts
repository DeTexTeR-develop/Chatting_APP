import { describe, it, expect, vi, afterEach } from "vitest";
import * as fc from "fast-check";
import { userService } from "../userService";

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Property 8 ──────────────────────────────────────────────────────────────
// Feature: react-client, Property 8: PATCH request sends only provided fields

describe("Property 8: PATCH request sends only provided fields", () => {
  it("request body contains exactly the fields passed to update — no extras, no omissions", async () => {
    // Validates: Requirements 7.2
    await fc.assert(
      fc.asyncProperty(
        // Arbitrary positive integer user IDs
        fc.integer({ min: 1, max: 100_000 }),
        // Non-empty subsets of { username?, email? } — at least one field must be present
        fc.oneof(
          // Only username
          fc.record({ username: fc.string({ minLength: 1, maxLength: 50 }) }),
          // Only email
          fc.record({ email: fc.emailAddress() }),
          // Both fields
          fc.record({
            username: fc.string({ minLength: 1, maxLength: 50 }),
            email: fc.emailAddress(),
          })
        ),
        async (userId, payload) => {
          const mockFetch = vi.fn().mockResolvedValue(
            new Response(
              JSON.stringify({ success: true, data: { user: {} } }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            )
          );
          vi.stubGlobal("fetch", mockFetch);

          await userService.update(userId, payload);

          expect(mockFetch).toHaveBeenCalledOnce();

          const [url, fetchOptions] = mockFetch.mock.calls[0] as [
            string,
            RequestInit
          ];

          // Verify PATCH method
          expect(fetchOptions.method).toBe("PATCH");

          // Verify the correct path contains the user ID
          expect(url).toMatch(new RegExp(`/user/${userId}$`));

          // Parse and verify the request body
          const body = JSON.parse(fetchOptions.body as string) as Record<
            string,
            unknown
          >;

          // Body must contain exactly the keys from the payload — no more, no less
          const payloadKeys = Object.keys(payload).sort();
          const bodyKeys = Object.keys(body).sort();

          expect(bodyKeys).toEqual(payloadKeys);

          // Values must match exactly
          for (const key of payloadKeys) {
            expect(body[key]).toBe(
              payload[key as keyof typeof payload]
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
