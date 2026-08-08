import { Socket } from "socket.io";
import { pubRedisClient } from "../../services/redisService/pubsub";
export default function registerTypingHandler(socket: Socket) {
    socket.on("conversation:typing:start", ({ conversationId }: { conversationId: string }) => {
        const userId  = socket.data.user.id;
        pubRedisClient.publish("chat:typing:start", JSON.stringify({
            conversationId,
            userId,
            senderSocketId: socket.id
        }));
    });
    socket.on("conversation:typing:stop", ({ conversationId }: { conversationId: string }) => {
        const userId = socket.data.user.id;
        pubRedisClient.publish("chat:typing:stop", JSON.stringify({
            conversationId,
            userId,
            senderSocketId: socket.id
        }));
    })
};

