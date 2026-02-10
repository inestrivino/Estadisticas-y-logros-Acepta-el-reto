import { getIO } from "./socketInit.ts"
import { EventType } from "./socketEventTypes.ts"
import redisClient from '../redis/redisClient.ts';

/*
Recibe el json que llego por rabbitMQ y actualiza los diagramas y logros correspondientes
*/
async function routerEvents(datos:any) {
    const io = getIO();
    console.log(" - Se emite un nuevo envio")

    let envioIds = await redisClient.sMembers('problema:problema1:envios');
    //console.log("envios antes: " + envioIds.length)
    const nextId = await redisClient.incr("nextId");
    await redisClient.hSet(nextId.toString(), {
        usuario: datos.usuario,
        problema: datos.problema,
        resultado: datos.resultado,
        lenguaje: datos.lenguaje,
        tiempo: datos.tiempo.toString(),
        memoria: datos.memoria.toString(),
        pos: datos.pos.toString(),
        fecha: datos.fecha
    });
    await redisClient.sAdd(`problema:${datos.problema}:envios`, nextId.toString())
    envioIds = await redisClient.sMembers('problema:problema1:envios');
    //console.log("envios despues: " + envioIds.length)

    const estados: Record<string, string> = {
        AC: "Aceptado",
        PE: "Error",
        WA: "Incorrecto",
        CE: "Error de compilación",
        RTE: "Error durante la ejecución",
        TLE: "Tiempo límite",
        MLE: "Límite de memoria",
        OLE: "Límite de salida",
        RF: "Función restringida",
        IQ: "En cola",
        IE: "Error interno",
    };

    io.emit(EventType.DIAGRAMA_PROBLEMAS, estados[datos.resultado])
}

export default routerEvents;