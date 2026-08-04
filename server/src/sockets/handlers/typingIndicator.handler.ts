import { Socket } from "socket.io";
export default function registerTypingHandler(socket: Socket) {
    socket.on("conversation:typing:start", ({ conversationId }: { conversationId: string }) => {
        const userId  = socket.data.user.id;
        socket.to(`conversation:${conversationId}`).emit(
            "conversation:typing:start",
        {
            userId,
            conversationId
        });
    });
    socket.on("conversation:typing:stop", ({ conversationId }: { conversationId: string }) => {
        const userId = socket.data.user.id;
        socket.to(`conversation:${conversationId}`).emit(
            "conversation:typing:stop",
            {
                userId,
                conversationId
            }
        )
    })
};

