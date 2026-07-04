/**
 * Shared API response types for the react-client.
 * All HTTP responses from the Express backend conform to these shapes.
 */

/**
 * Generic wrapper for all API responses.
 * Matches the server's standard response envelope.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

/**
 * Represents a user record returned from the server.
 */
export interface UserRow {
  id: number;
  username: string;
  email: string;
  role?: string;
  created_at: string;
}

/**
 * Payload for updating a user's profile via PATCH /user/:id.
 * Only the provided fields will be sent in the request body.
 */
export interface UpdateUserPayload {
  username?: string;
  email?: string;
}

/**
 * Payload for POST /auth/login.
 */
export interface LoginPayload {
  email: string;
  password: string;
}

/**
 * Payload for POST /auth/signup.
 */
export interface SignupPayload {
  username: string;
  email: string;
  password: string;
}

/**
 * A conversation row returned from GET /chat or POST /chat.
 */
export interface ConversationRow {
  id: number;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_username?: string;
}

/**
 * A message row returned from GET /chat/:id/messages or POST /chat/:id/messages.
 */
export interface MessageRow {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
}
