import type { ApiResponse } from "../types/api.types";

// Module-level reference to the AuthContext dispatch function.
// Registered via setAuthContextRef so apiClient can clear the session on 401.
let authDispatch: ((action: { type: "CLEAR_USER" }) => void) | null = null;

/**
 * Register the AuthContext dispatch function.
 * Call this once inside the AuthContext provider so that any 401 response
 * from any API call automatically clears the current session.
 */
export function setAuthContextRef(
  dispatch: (action: { type: "CLEAR_USER" }) => void
): void {
  authDispatch = dispatch;
}

/**
 * Base HTTP request wrapper used by all service modules.
 *
 * - Prepends VITE_API_BASE_URL to every path
 * - Always sets credentials: "include" and Content-Type: application/json
 * - On 401: dispatches CLEAR_USER via the registered authDispatch, then
 *   returns the parsed JSON body (so callers still see the error shape)
 * - On network failure (fetch throws): returns a structured error response
 */
async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";
  const url = `${baseUrl}${path}`;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });

    // On 401, clear the auth session before returning the parsed body
    if (response.status === 401 && authDispatch) {
      authDispatch({ type: "CLEAR_USER" });
    }

    // Parse and return the JSON body for all non-network-error cases
    const data = (await response.json()) as ApiResponse<T>;
    return data;
  } catch {
    // fetch threw — network-level error (connection refused, DNS failure, timeout, etc.)
    return {
      success: false,
      message: "Unable to reach the server. Please check your connection.",
    };
  }
}

/** Convenience object that bundles all apiClient exports */
export const apiClient = { request, setAuthContextRef };

export default request;
