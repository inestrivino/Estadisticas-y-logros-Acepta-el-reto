import { createClient } from "redis";

const redisClient = createClient({ url: "redis://localhost:6379" });

redisClient.connect()
  .then(
    () => console.log(" * Conexión establecida con Redis")
  )
  .catch(
    err => console.error("No se pudo conectar a Redis", err)
  );

export default redisClient;