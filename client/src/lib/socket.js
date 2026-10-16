import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const SOCKET_URL = API_URL.replace(/\/api\/?$/, "");

export function createTicketSocket(token) {
  if (!token) return null;

  return io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });
}
