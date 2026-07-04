import redisClient from "./redis";

const ONLINE_KEY = 'online_users';

export async function setUserOnline(userId: string) {
    await redisClient.sadd(ONLINE_KEY, userId);
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

