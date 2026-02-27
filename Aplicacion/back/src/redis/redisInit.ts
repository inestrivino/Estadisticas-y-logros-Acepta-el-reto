import redisClient from './redisClient.ts';
import fs from "fs";

export async function initRedis () {

    //si ya hay datos en redis no hago nada
    if (await redisClient.DBSIZE() > 0) {
        console.log(" * Redis ya inicializado, no se cargan los envios de prueba");
        return;
    }

    await redisClient.flushAll();
    
    const envios = JSON.parse(fs.readFileSync("./data/envios.json", "utf8"));

    const pipeline = redisClient.multi();

    for (const envio of envios) {
        if (envio.id > 100000)
            break;

        //meto cada envio en redis con su id como clave
        const nextId = await redisClient.incr("nextId");
        pipeline.hSet(nextId.toString(), {
            usuario: envio.usuario,
            problema: envio.problema,
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            tiempo: envio.tiempo.toString(),
            memoria: envio.memoria.toString(),
            pos: envio.pos.toString(),
            fecha: envio.fecha
        });

        pipeline.sAdd(`problema:${envio.problema}:envios`, nextId.toString());
        
        //Actualiza el tiempo total y el numero de envios
        const tiempo = Number(envio.tiempo);
        await redisClient.hIncrByFloat(`problema:${envio.problema}`, "totalTiempo", tiempo);
        await redisClient.hIncrBy(`problema:${envio.problema}`, "totalEnvios", 1);
        
        //Actualiza el tiempo minimo o en caso de no estar inicializado lo pone a un numero alto
        const tiempoMinActual = await redisClient.hGet(`problema:${envio.problema}`, "minTiempo") || 2345678;
        if (tiempoMinActual === null || tiempo < Number(tiempoMinActual)) {
            await redisClient.hSet(`problema:${envio.problema}`, "minTiempo", tiempo.toString());
        }
    }

    await pipeline.exec();
    console.log(" * Redis inicializado con envios de prueba");
}