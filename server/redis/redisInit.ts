import redisClient from './redisClient.js';
import fs from "fs";

export async function initRedis () {

    //si ya hay datos en redis no hago nada
    if (await redisClient.DBSIZE() > 0) {
        console.log(" * Redis ya inicializado, no se cargan los envios de prueba");
        return;
    }

    redisClient.flushAll();
    
    const envios = JSON.parse(fs.readFileSync("./data/envios.json", "utf8"));

    const pipeline = redisClient.multi();

    for (const envio of envios) {
        if (envio.id > 100000)
            break;

        //meto cada envio en redis con su id como clave
        pipeline.hSet(envio.id.toString(), {
            usuario: envio.usuario,
            problema: envio.problema,
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            tiempo: envio.tiempo.toString(),
            memoria: envio.memoria.toString(),
            pos: envio.pos.toString(),
            fecha: envio.fecha
        });

        pipeline.sAdd(`problema:${envio.problema}:envios`, envio.id.toString());
    }

    await pipeline.exec();
    console.log(" * Redis inicializado con envios de prueba");
}