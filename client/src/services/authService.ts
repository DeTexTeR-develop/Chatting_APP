import { apiClient } from "../api/apiClient";
import type { ApiResponse, LoginPayload, SignupPayload } from "../types/api.types";

/**
 * Service module for authentication-related API calls.
 * All requests go through apiClient which handles credentials,
 * base URL, and error normalization.
 */
export const authService = {
  /**
   * POST /auth/login
   * Authenticates a user and sets an httpOnly session cookie on success.
   */
  login(payload: LoginPayload): Promise<ApiResponse> {
    return apiClient.request("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  /**
   * POST /auth/signup
   * Registers a new user account.
   */
  signup(payload: SignupPayload): Promise<ApiResponse> {
    return apiClient.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
