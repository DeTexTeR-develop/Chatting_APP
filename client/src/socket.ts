import { io } from "socket.io-client";

/**
 * Single shared socket.io client instance.
 *
 * withCredentials: true ensures the browser sends the httpOnly token cookie
 * with the socket connection, so the server middleware can authenticate it.
 *
 * autoConnect: false means the socket won't connect immediately on import —
 * we call socket.connect() manually after the user logs in.
 */
const socket = io(import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001", {
  withCredentials: true,
  autoConnect: false,
});

export default socket;
