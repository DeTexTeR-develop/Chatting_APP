import { apiClient } from "../api/apiClient";
import type { ApiResponse, UpdateUserPayload, UserRow } from "../types/api.types";

/**
 * Service module for user-related API calls.
 * All requests go through apiClient which handles credentials,
 * base URL, and error normalization.
 */
export const userService = {
  /**
   * GET /user
   * Returns all users. Requires a valid session cookie.
   */
  getAll(): Promise<ApiResponse<{ users: UserRow[] }>> {
    return apiClient.request<{ users: UserRow[] }>("/user");
  },

  /**
   * GET /user/:id
   * Returns a single user by ID. Requires a valid session cookie.
   */
  getById(id: number | string): Promise<ApiResponse<{ user: UserRow }>> {
    return apiClient.request<{ user: UserRow }>(`/user/${id}`);
  },

  /**
   * PATCH /user/:id
   * Updates only the fields present in the payload.
   * Undefined/null values are stripped before sending so the server
   * never receives keys for omitted fields.
   * Requires a valid session cookie.
   */
  update(
    id: number | string,
    payload: UpdateUserPayload
  ): Promise<ApiResponse<{ user: UserRow }>> {
    // Strip any undefined or null values — send only provided fields
    const body = Object.fromEntries(
      Object.entries(payload).filter(
        ([, value]) => value !== undefined && value !== null
      )
    );

    return apiClient.request<{ user: UserRow }>(`/user/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },

  /**
   * DELETE /user/:id
   * Deletes a user. Requires Admin role and a valid session cookie.
   */
  delete(id: number | string): Promise<ApiResponse> {
    return apiClient.request(`/user/${id}`, {
      method: "DELETE",
    });
  },

  /**
   * GET /user
   * Alias for getAll(), used during app initialization to verify
   * whether the current session cookie is still valid.
   */
  getMe(): Promise<ApiResponse<{ users: UserRow[] }>> {
    return apiClient.request<{ users: UserRow[] }>("/user");
  },
};
