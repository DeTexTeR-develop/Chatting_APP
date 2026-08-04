import { Socket } from "socket.io"
export default function registerConversationHandler(socket: Socket) {
    socket.on("join_conversation", (conversationId: string) => {
        socket.join(`conversation:${conversationId}`);
        console.log(

            `User ${socket.data.user.username} joined conversation: ${conversationId}`

        );
    })
}