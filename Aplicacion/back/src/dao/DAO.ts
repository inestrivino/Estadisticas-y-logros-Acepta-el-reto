import redisClient from '../redis/redisClient.js';

export default class DAO {
    protected redis;

    constructor() {
        this.redis = redisClient;
    }

    protected setRedis(redisClientTest: typeof redisClient) {
        this.redis = redisClientTest;
    }
}