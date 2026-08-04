import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { setIO } from "../socket";
import verifySocketConnection from "../../middleware/socketVerification";
import registerPresenceHandler from "./presence.handler";
import registerConversationHandler from "./conversationRoom.handler";
export default function initializeSocket(httpServer: HttpServer) {

    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:4200"],
            credentials: true
        }
    });

    setIO(io);
    io.use(verifySocketConnection);
    io.on("connection", async (socket) => {
        await registerPresenceHandler(io, socket);
        registerConversationHandler(socket)
    });
};
