import redisClient from '../redis/redisClient.js';

export default abstract class DAO {
    protected redis;

    constructor() {
        this.redis = redisClient;
    }

    /**
     * Sustituye el cliente Redis por uno de prueba.
     * @param redisClientTest - Cliente Redis alternativo para tests.
     */
    public setRedis(redisClientTest: typeof redisClient) {
        this.redis = redisClientTest;
    }
}