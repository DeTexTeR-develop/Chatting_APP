import { getAllOnlineUsers, setUserOffline, setUserOnline } from "../../services/userPresenceService";
import { Server, Socket } from "socket.io";
export default async function registerPresenceHandler(io: Server, socket: Socket) {
    const userId = socket.data.user.id;

    const userOnline = await setUserOnline(userId, socket.id);
    if (userOnline) {
        io.emit("user_online", { userId });
    }

    const onlineUsers = await getAllOnlineUsers();
    socket.emit("online_users", { userIds: onlineUsers });

    socket.on("get_online_users", async () => {
        const onlineUsers = await getAllOnlineUsers();
        socket.emit("online_users", { userIds: onlineUsers });
    });

    socket.on("disconnect", async () => {
        const userOffline = await setUserOffline(userId, socket.id);
        if (userOffline) {
            io.emit("user_offline", { userId });
            console.log("User Went Offline ")
        };
    });
}
