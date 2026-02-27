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

    // Actualiza los tiempos
    const { nuevoTotalTiempo, nuevoTotalEnvios } = await actualizaTiempos(datos);

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

    io.emit(EventType.DIAGRAMA_PROBLEMAS, estados[datos.resultado]);

    io.emit(EventType.ENVIOS_PROBLEMA, envioIds.length);

    const mediaNueva = nuevoTotalTiempo / nuevoTotalEnvios;
    io.emit(EventType.TIEMPO_MEDIO_PROBLEMA, mediaNueva.toFixed(4));
    
    const tiempoMin = await redisClient.hmGet("problema:problema1", "minTiempo");
    io.emit(EventType.TIEMPO_MIN_PROBLEMA, Number(tiempoMin).toFixed(4));
}

async function actualizaTiempos(datos: any): Promise<{ nuevoTotalTiempo: number; nuevoTotalEnvios: number }> {
    const [totalTiempoStr, totalEnviosStr] = await redisClient.hmGet("problema:problema1", ["totalTiempo", "totalEnvios"]);
    const tiempo = Number(datos.tiempo);

    const totalTiempo = Number(totalTiempoStr) || 0;
    const totalEnvios = Number(totalEnviosStr) || 0;

    const nuevoTotalTiempo = totalTiempo + tiempo;
    const nuevoTotalEnvios = totalEnvios + 1;
    await redisClient.hSet(`problema:${datos.problema}`, {
        totalTiempo: nuevoTotalTiempo.toString(),
        totalEnvios: nuevoTotalEnvios.toString()
    });

    const tiempoMinActual = await redisClient.hGet(`problema:${datos.problema}`, "minTiempo");
    if (tiempoMinActual === null || tiempo < Number(tiempoMinActual)) {
        await redisClient.hSet(`problema:${datos.problema}`, "minTiempo", tiempo.toString());
    }

    return { nuevoTotalTiempo, nuevoTotalEnvios };
}

export default routerEvents;