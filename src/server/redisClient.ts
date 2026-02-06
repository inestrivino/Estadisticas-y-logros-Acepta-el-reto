import { createClient } from "redis";

/*
docker run -d --name redis-server -p 6379:6379 redis
*/

const redisClient = createClient({ url: "redis://localhost:6379" });

redisClient.connect()
  .then(
    () => console.log(" * Conexión establecida con Redis")
  )
  .catch(
    err => console.error("No se pudo conectar a Redis", err)
  );

export default redisClient;