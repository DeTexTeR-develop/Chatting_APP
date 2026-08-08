import { Server } from "socket.io";
import { Server as HttpServer } from "http";
import { setIO } from "../socket";
import verifySocketConnection from "../../middleware/socketVerification";
import registerPresenceHandler from "./presence.handler";
import registerConversationHandler from "./conversationRoom.handler";
import registerTypingHandler from "./typingIndicator.handler";
import { subRedisClient } from "../../services/redisService/pubsub";
export default function initializeSocket(httpServer: HttpServer) {
    
    const io = new Server(httpServer, {
        cors: {
            origin: ["http://localhost:5173", "http://localhost:4200"],
            credentials: true
        }
    });

    setIO(io);

    subRedisClient.subscribe(
        "chat:message",
        "chat:presence:online",
        "chat:presence:offline",
        "chat:typing:start",
        "chat:typing:stop" );


    subRedisClient.on("message", (channel, rawMessage)=> {
        const payload = JSON.parse(rawMessage);
        switch(channel){
            case "chat:message":
                io.to(`conversation:${payload.conversationId}`).emit("receive_message", {
                    message: payload.message
                });
                break;

            case "chat:presence:online": 
                io.emit("user_online", {
                    userId: payload.userId
                });
                break;
            
            case "chat:presence:offline":
                io.emit("user_offline", {
                    userId: payload.userId
                });
                break;
            
            case "chat:typing:start":
                io.to(`conversation:${payload.conversationId}`)
                .except(payload.senderSocketId)
                .emit("conversation:typing:start", {
                    conversationId: payload.conversationId,
                    userId: payload.userId
                });
                break;

            case "chat:typing:stop": 
                io.to(`conversation:${payload.conversationId}`)
                .except(payload.senderSocketId)
                .emit("conversation:typing:stop", {
                    conversationId: payload.conversationId,
                    userId: payload.userId
                });
                break;
        
        };
    });

    io.use(verifySocketConnection);
    io.on("connection", async (socket) => {
        await registerPresenceHandler(socket);
        registerConversationHandler(socket);
        registerTypingHandler(socket);
    });
};
