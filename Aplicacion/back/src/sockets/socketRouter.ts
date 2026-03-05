import { getIO } from "./socketInit.js"
import { EventType, formatProblemEvent } from "shared";
import { procesarEnvio } from "../db/cargarDatos.js";
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
    await procesarEnvio(envio);

    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_PROBLEMAS), envio.resultado);

    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_LENGUAJES), envio.lenguaje);

    io.emit(formatProblemEvent(envio.problema, EventType.ENVIOS_PROBLEMA), await redisClient.get(`problema:${envio.problema}:envios`));

    const tiempoTotal = await redisClient.get(`problema:${envio.problema}:tiempoTotal`);
    const aciertos = await redisClient.get(`problema:${envio.problema}:aciertos`);
    const promedio = aciertos && Number(aciertos) > 0 ? Number(tiempoTotal) / Number(aciertos) : 0;
    io.emit(formatProblemEvent(envio.problema, EventType.TIEMPO_PROM_PROBLEMA), promedio);
    
    const current = await redisClient.get(`problema:${envio.problema}:mejorTiempo`);
    let min = current ? Number(current) : null;
    if (min !== null && Number(min) > envio.tiempo)
        min = envio.tiempo as number;
    io.emit(formatProblemEvent(envio.problema, EventType.MEJOR_TIEMPO_PROBLEMA), min);
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