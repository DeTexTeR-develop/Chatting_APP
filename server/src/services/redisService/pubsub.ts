import redisClient from "./redis";

const pubRedisClient = redisClient.duplicate();
const subRedisClient = redisClient.duplicate();

pubRedisClient.on("error", (err) => console.error('Pub redis err: ', err));
subRedisClient.on("error", (err) => console.error('Sub redis err: ', err));



export { pubRedisClient, subRedisClient };