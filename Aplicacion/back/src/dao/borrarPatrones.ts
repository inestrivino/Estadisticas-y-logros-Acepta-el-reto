import redisClient from '../redis/redisClient.js';

/**
 * Borra todas las claves de Redis que coincidan con alguno de los patrones dados.
 * @param patrones - Array de patrones glob (ej. 'usuario:*:envios').
 */
export async function borrarPatrones(patrones: string[]): Promise<void> {
    for (const patron of patrones) {
        const pipeline = redisClient.multi();
        for await (const claves of redisClient.scanIterator({ MATCH: patron, COUNT: 100 }))
            if (claves.length > 0) pipeline.del(claves);
        await pipeline.exec();
    }
}
