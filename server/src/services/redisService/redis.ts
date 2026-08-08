import {Redis} from 'ioredis';

const redisClient = new Redis();
redisClient.on("error", (err) => console.error('Redis err: ', err));
export default redisClient;