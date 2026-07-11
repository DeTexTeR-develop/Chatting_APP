import app from "./app";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { setIO } from "./sockets/socket";

import dotenv from "dotenv";
import verifySocketConnection from "./middleware/socketVerification";
import { getAllOnlineUsers, setUserOffline, setUserOnline } from "./services/userPresenceService";
dotenv.config();

const PORT = process.env.PORT;


const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: ["http://localhost:5173", "http://localhost:4200"],
        credentials: true
    }
});

setIO(io);

io.use(verifySocketConnection);

io.on("connection", async(socket) => {
    console.log("User connected:", socket.id);

    const userId = socket.data.user.id;

    await setUserOnline(userId);
    io.emit("user_online", {userId});


    socket.on("join_conversation", (conversationId: string) => {
        socket.join("conversation:" + conversationId );
        console.log(`User ${socket.data.user.username} joined conversation: ${conversationId}`);
    });

    const onlineUsers = await getAllOnlineUsers();
    socket.emit("online_users", {userIds: onlineUsers});

    socket.on("get_online_users", async () => {
        const onlineUsers = await getAllOnlineUsers();
        socket.emit("online_users", { userIds: onlineUsers });
    });

    socket.on("disconnect", async () => {
    await setUserOffline(userId);
    io.emit("user_offline", { userId });
  });
});



httpServer.listen(PORT, () => {
    console.log("server is running on " + PORT);
});