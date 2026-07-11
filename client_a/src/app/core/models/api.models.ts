export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface UserRow {
  id: number;
  username: string;
  email: string;
  role?: string;
  created_at: string;
}

export interface ConversationRow {
  id: number;
  user1_id: string;
  user2_id: string;
  created_at: string;
  other_username?: string;
}

export interface MessageRow {
  id: number;
  conversation_id: number;
  sender_id: string;
  content: string;
  created_at: string;
  sender_username?: string;
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role?: string;
}
