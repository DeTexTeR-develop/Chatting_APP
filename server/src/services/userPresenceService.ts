import redisClient from "./redis";

const ONLINE_KEY = 'online_users';

const userSockets = new Map<string, Set<string>>();

export async function setUserOnline(userId: string) {
    if(userSockets.has(userId)) {
        await redisClient.sadd(ONLINE_KEY, userId);
    }
};

export async function setUserOffline(userId: string){
    await redisClient.srem(ONLINE_KEY, userId);
};

export async function getAllOnlineUsers() : Promise<string[]> {
    return redisClient.smembers(ONLINE_KEY);
};

export async function isUserOnline(userId: string){
    return (await redisClient.sismember(ONLINE_KEY, userId));
};

