import redisClient from '../redis/redisClient.js';

export default class DAO {
    protected redis;

    constructor(redisClientTest?: typeof redisClient) {
        this.redis = redisClientTest ?? redisClient;
    }
}