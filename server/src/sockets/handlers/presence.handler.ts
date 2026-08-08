import { pubRedisClient } from "../../services/redisService/pubsub";
import { getAllOnlineUsers, setUserOffline, setUserOnline } from "../../services/userPresenceService";
import { Socket } from "socket.io";
export default async function registerPresenceHandler(
    socket: Socket) {
    const userId = socket.data.user.id;

    const userOnline = await setUserOnline(userId, socket.id);
    if (userOnline) {
        pubRedisClient.publish("chat:presence:online", JSON.stringify({
            userId
        }))
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
            pubRedisClient.publish("chat:presence:offline", JSON.stringify({
                userId
            }));
        };
    });
}
