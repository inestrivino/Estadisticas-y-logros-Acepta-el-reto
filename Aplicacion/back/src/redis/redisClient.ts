import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL || "redis://localhost:6379" });

export default redisClient;

await redisClient.connect()
  .then(
    () => console.log(" * Conexión establecida con Redis")
  )
  .catch(
    err => console.error("No se pudo conectar a Redis", err)
  );