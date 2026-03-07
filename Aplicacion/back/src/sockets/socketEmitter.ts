import { getIO } from "./socketInit.js"
import { EventType, formatProblemEvent } from "shared";
import { procesarEnvio } from "../db/cargarDatos.js";
import ProblemaDAO from "src/dao/problemaDAO.js";

const problemaDAO = new ProblemaDAO();

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
export default async function routerEvents(envio:Envio) {
    //se obtiene el socket para emitir los eventos
    const io = getIO();

    //se procesa el envio y se guarda en la base de datos
    await procesarEnvio(envio);

    //se actualizan los diagramas de estadisticas de problemas
    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_PROBLEMAS), envio.resultado);
    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_LENGUAJES), envio.lenguaje);
    io.emit(formatProblemEvent(envio.problema, EventType.ENVIOS_PROBLEMA), await problemaDAO.getNumEnvios(envio.problema));
    io.emit(formatProblemEvent(envio.problema, EventType.TIEMPO_PROM_PROBLEMA), await problemaDAO.getTiempoPromedio(envio.problema));
    io.emit(formatProblemEvent(envio.problema, EventType.MEJOR_TIEMPO_PROBLEMA), await problemaDAO.getMejorTiempo(envio.problema));
}