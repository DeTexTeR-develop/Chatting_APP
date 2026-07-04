import app from "./app";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { setIO } from "./sockets/socket";

import dotenv from "dotenv";
import verifySocketConnection from "./middleware/socketVerification";
dotenv.config();

const PORT = process.env.PORT;


const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173"],
        credentials: true
    }
});

setIO(io);

io.use(verifySocketConnection);

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_conversation", (conversationId: string) => {
        socket.join("conversation:" + conversationId );
        console.log(`User ${socket.data.user.username} joined conversation: ${conversationId}`);
    })

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});



httpServer.listen(PORT, () => {
    console.log("server is running on " + PORT);
});