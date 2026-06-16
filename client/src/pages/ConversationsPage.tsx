import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { chatService } from "../services/chatService";
import { userService } from "../services/userService";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import type { ConversationRow, UserRow } from "../types/api.types";

/**
 * ConversationsPage — shows all conversations for the logged-in user.
 *
 * Also shows a list of all users so you can start a new conversation
 * by clicking "Message" next to any user.
 */
export function ConversationsPage(): React.JSX.Element {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  // ── Conversations ──────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [convError, setConvError] = useState<string | null>(null);

  // ── All users (for starting new conversations) ────────────────────────────
  const [users, setUsers] = useState<UserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // ── Starting a new conversation ───────────────────────────────────────────
  const [startingWith, setStartingWith] = useState<number | string | null>(null);

  useEffect(() => {
    let cancelled = false;

    // Fetch this user's conversations
    async function fetchConversations() {
      setConvLoading(true);
      setConvError(null);
      const res = await chatService.getConversations();
      if (cancelled) return;
      // Server returns { success, conversations: [...] } at the top level
      const raw = res as unknown as { success: boolean; conversations?: ConversationRow[] };
      if (raw.success) {
        setConversations(raw.conversations ?? []);
      } else {
        setConvError("Failed to load conversations.");
      }
      setConvLoading(false);
    }

    // Fetch all users so we can start new conversations
    async function fetchUsers() {
      setUsersLoading(true);
      const res = await userService.getAll();
      if (cancelled) return;
      const raw = res as unknown as { success: boolean; users?: UserRow[] };
      if (raw.success && Array.isArray(raw.users)) {
        // Exclude the logged-in user from the list
        setUsers(raw.users.filter((u) => u.id !== authUser?.id));
      }
      setUsersLoading(false);
    }

    fetchConversations();
    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id]);

  async function handleStartConversation(userId: number | string) {
    setStartingWith(userId);
    const res = await chatService.createConversation(userId);
    setStartingWith(null);
    // Server returns { success, conversation: {...} } at the top level
    const raw = res as unknown as { success: boolean; conversation?: ConversationRow };
    if (raw.success && raw.conversation) {
      navigate(`/chat/${raw.conversation.id}`);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  // For display: given a conversation, show the other person's id
  function getOtherUserId(conv: ConversationRow): string {
    return conv.user1_id === String(authUser?.id) ? conv.user2_id : conv.user1_id;
  }

  return (
    <main style={{ padding: "1.5rem", maxWidth: "700px" }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "1.5rem" }}>
        Conversations
      </h1>

      {/* ── Existing conversations ─────────────────────────────────────── */}
      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Your chats
        </h2>

        {convLoading && <LoadingSpinner />}
        {convError && <ErrorMessage message={convError} />}

        {!convLoading && !convError && conversations.length === 0 && (
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>
            No conversations yet. Start one below.
          </p>
        )}

        {!convLoading && conversations.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {conversations.map((conv) => (
              <li
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 500 }}>
                  Chat with user {getOtherUserId(conv)}
                </span>
                <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  {new Date(conv.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ── Start a new conversation ───────────────────────────────────── */}
      <section>
        <h2 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: "0.75rem" }}>
          Message someone
        </h2>

        {usersLoading && <LoadingSpinner />}

        {!usersLoading && users.length === 0 && (
          <p style={{ color: "#6b7280", fontSize: "0.9rem" }}>No other users found.</p>
        )}

        {!usersLoading && users.length > 0 && (
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {users.map((user) => (
              <li
                key={user.id}
                style={{
                  padding: "0.75rem 1rem",
                  borderRadius: "6px",
                  border: "1px solid #e5e7eb",
                  backgroundColor: "#fff",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{user.username}</span>
                  <span style={{ marginLeft: "0.5rem", color: "#6b7280", fontSize: "0.85rem" }}>
                    {user.email}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={startingWith === user.id}
                  onClick={() => void handleStartConversation(user.id)}
                  style={{
                    padding: "0.35rem 0.9rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: startingWith === user.id ? "#9ca3af" : "#2563eb",
                    color: "#fff",
                    fontSize: "0.85rem",
                    cursor: startingWith === user.id ? "not-allowed" : "pointer",
                  }}
                >
                  {startingWith === user.id ? "Opening…" : "Message"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default ConversationsPage;
