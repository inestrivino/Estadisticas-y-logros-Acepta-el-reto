import { beforeAll, afterAll, beforeEach } from 'vitest';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { createClient } from 'redis';
import DAO from '../DAO.js';

let container: StartedRedisContainer;
let redis: ReturnType<typeof createClient>;

export default async function setUpTestFile(dao: DAO) {
    beforeAll(async () => {
        container = await new RedisContainer('redis:alpine').start();

        redis = createClient({
            url: container.getConnectionUrl(),
        });
        await redis.connect();

        dao.setRedis(redis);
    });

    beforeEach(async () => {
        await redis.flushAll();
    });

    afterAll(async () => {
        await redis.quit();
        await container.stop();
    });
}