import React, { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { chatService } from "../services/chatService";
import { useAuth } from "../hooks/useAuth";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { ErrorMessage } from "../components/ErrorMessage";
import socket from "../socket";
import type { MessageRow } from "../types/api.types";

export function ChatPage(): React.JSX.Element {
  const { id: conversationId } = useParams<{ id: string }>();
  const { user: authUser } = useAuth();

  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Load message history on mount
  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;

    async function fetchMessages() {
      setLoading(true);
      const res = await chatService.getMessages(conversationId!);
      if (cancelled) return;
      // Server returns { success: true, messages: [...] }
      const raw = res as unknown as { success: boolean; messages?: MessageRow[] };
      setMessages(raw.messages ?? []);
      setLoading(false);
    }

    fetchMessages();
    return () => { cancelled = true; };
  }, [conversationId]);

  // Connect socket and join conversation room
  useEffect(() => {
    if (!conversationId) return;

    function joinRoom() {
      socket.emit("join_conversation", conversationId!);
    }

    if (!socket.connected) {
      socket.connect();
    } else {
      // Already connected — join immediately
      joinRoom();
    }

    // Re-join if socket reconnects (e.g. after auth completes)
    socket.on("connect", joinRoom);

    function onReceiveMessage(data: { message: MessageRow }) {
      setMessages((prev) => [...prev, data.message]);
    }

    socket.on("receive_message", onReceiveMessage);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("receive_message", onReceiveMessage);
    };
  }, [conversationId]);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !conversationId) return;

    setSendError(null);
    setSending(true);
    const res = await chatService.sendMessage(conversationId, input.trim());
    setSending(false);

    const raw = res as unknown as { success: boolean };
    if (raw.success) {
      setInput("");
    } else {
      setSendError("Failed to send. Please try again.");
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 56px)" }}>

      {/* Messages list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1rem 1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", marginTop: "2rem" }}>
            No messages yet. Say hello!
          </p>
        )}

        {messages.map((msg) => {
          const isOwn = String(msg.sender_id) === String(authUser?.id);
          const raw = msg as unknown as { sender_username?: string };
          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "0.2rem", paddingLeft: "0.25rem", paddingRight: "0.25rem" }}>
                {isOwn ? "You" : (raw.sender_username ?? `User ${msg.sender_id}`)}
              </span>
              <div
                style={{
                  maxWidth: "65%",
                  padding: "0.5rem 0.875rem",
                  borderRadius: "12px",
                  backgroundColor: isOwn ? "#2563eb" : "#f3f4f6",
                  color: isOwn ? "#fff" : "#111827",
                  fontSize: "0.95rem",
                  lineHeight: "1.4",
                }}
              >
                {msg.content}
              </div>
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      {sendError && (
        <div style={{ padding: "0 1.5rem 0.5rem" }}>
          <ErrorMessage message={sendError} />
        </div>
      )}

      {/* Input bar */}
      <form
        onSubmit={(e) => void handleSend(e)}
        style={{
          display: "flex",
          gap: "0.5rem",
          padding: "0.75rem 1.5rem",
          borderTop: "1px solid #e5e7eb",
          backgroundColor: "#fff",
        }}
      >
        <input
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          style={{
            flex: 1,
            padding: "0.5rem 0.875rem",
            borderRadius: "8px",
            border: "1px solid #d1d5db",
            fontSize: "0.95rem",
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: sending || !input.trim() ? "#9ca3af" : "#2563eb",
            color: "#fff",
            fontWeight: 500,
            cursor: sending || !input.trim() ? "not-allowed" : "pointer",
            fontSize: "0.95rem",
          }}
        >
          {sending ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}

export default ChatPage;
