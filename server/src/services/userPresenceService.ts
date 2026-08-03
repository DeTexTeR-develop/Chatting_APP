import { broadcast } from "node:stream/iter";

import redisClient from "./redis";

const ONLINE_KEY = 'online_users';

export async function setUserOnline(userId: string, socketId: string) : Promise<boolean>{
    await redisClient.sadd(`presence:${userId}`, socketId)
    const count = await redisClient.scard(`presence:${userId}`);
    if(count === 1){
        await redisClient.sadd(ONLINE_KEY, userId);
    };
    return count === 1;
};

export async function setUserOffline(userId: string, socketId: string){
    await redisClient.srem(`presence:${userId}`, socketId);
    const count = await redisClient.scard(`presence:${userId}`);
    if(count === 0){
        await redisClient.srem(ONLINE_KEY, userId);
        await redisClient.del(`presence:${userId}`);
    };
    return count === 0;
};

export async function getAllOnlineUsers() : Promise<string[]> {
    return redisClient.smembers(ONLINE_KEY);
};

export async function isUserOnline(userId: string){
    return (await redisClient.sismember(ONLINE_KEY, userId));
};

