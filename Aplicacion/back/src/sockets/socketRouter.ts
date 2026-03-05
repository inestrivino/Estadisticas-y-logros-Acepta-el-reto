import { getIO } from "./socketInit.js"
import { EventType, formatProblemEvent } from "shared";
import { procesarEnvio } from "../db/inicializar.js";
import redisClient from '../redis/redisClient.js';
import { format } from "path";

type Envio = {
    "usuario": string,
    "problema": string,
    "resultado": string,
    "lenguaje": string,
    "tiempo": number,
    "memoria": number,
    "pos": number,
    "fecha": string
};

/*
Recibe el json que llego por rabbitMQ y actualiza los diagramas correspondientes
*/
async function routerEvents(envio:Envio) {
    const io = getIO();
    console.log(" - Se emite un nuevo envio")

    //se procesa el envio y se guarda en la base de datos
    procesarEnvio(envio);

    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_PROBLEMAS), envio.resultado);

    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_LENGUAJES), envio.lenguaje);

    //io.emit(EventType.ENVIOS_PROBLEMA, envioIds.length);

    //const mediaNueva = nuevoTotalTiempo / nuevoTotalEnvios;
    //io.emit(EventType.TIEMPO_MEDIO_PROBLEMA, mediaNueva.toFixed(4));
    
    //const tiempoMin = await redisClient.hmGet("problema:problema1", "minTiempo");
    //io.emit(EventType.TIEMPO_MIN_PROBLEMA, Number(tiempoMin).toFixed(4));*/
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