import redisClient from '../redis/redisClient.js';

export default abstract class DAO {
    protected redis;

    constructor() {
        this.redis = redisClient;
    }

    protected setRedis(redisClientTest: typeof redisClient) {
        this.redis = redisClientTest;
    }

    public async registrarDato(dato: any, pipeline?:any) {
        if (pipeline !== undefined)
            await this.agregarAlPipeline(dato, pipeline);
        else
            await this.registrarDirecto(dato);
    }

    abstract registrarDirecto(dato: any): Promise<void>;
    abstract agregarAlPipeline(dato:any, pipeline: any): Promise<void>;
}