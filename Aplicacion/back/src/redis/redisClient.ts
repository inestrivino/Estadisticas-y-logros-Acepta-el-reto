import { createClient } from "redis";

const redisClient = createClient({ 
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 500, 3000)
    }
});

export default redisClient;