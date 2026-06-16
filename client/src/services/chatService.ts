import { apiClient } from "../api/apiClient";
import type { ApiResponse, ConversationRow, MessageRow } from "../types/api.types";

/**
 * Service module for conversation and message API calls.
 * All HTTP requests go through apiClient (credentials, base URL, error handling).
 */
export const chatService = {
  /**
   * GET /chat
   * Returns all conversations the logged-in user is part of.
   */
  getConversations(): Promise<ApiResponse<ConversationRow[]>> {
    return apiClient.request<ConversationRow[]>("/chat");
  },

  /**
   * POST /chat
   * Creates a new conversation with another user, or returns the existing one.
   * Body: { userIdForSecond: userId }
   */
  createConversation(userId: number | string): Promise<ApiResponse<{ conversation: ConversationRow }>> {
    return apiClient.request<{ conversation: ConversationRow }>("/chat", {
      method: "POST",
      body: JSON.stringify({ userIdForSecond: userId }),
    });
  },

  /**
   * GET /chat/:id/messages
   * Returns all messages in a conversation, ordered oldest first.
   */
  getMessages(conversationId: number | string): Promise<ApiResponse<MessageRow[]>> {
    return apiClient.request<MessageRow[]>(`/chat/${conversationId}/messages`);
  },

  /**
   * POST /chat/:id/messages
   * Sends a message to a conversation.
   * Body: { content: string }
   */
  sendMessage(conversationId: number | string, content: string): Promise<ApiResponse<{ message: MessageRow }>> {
    return apiClient.request<{ message: MessageRow }>(`/chat/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });
  },
};
