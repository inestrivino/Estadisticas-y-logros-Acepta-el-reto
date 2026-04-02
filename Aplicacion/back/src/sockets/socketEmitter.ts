import { getIO } from "./socketInit.js"
import { EventType, formatEvent } from "shared";
import { cargarEnvio } from "../db/cargarDatos.js";
import ProblemaDAO from "src/dao/problemaDAO.js";
import UsuarioDAO from "src/dao/usuarioDAO.js";

const problemaDAO = new ProblemaDAO();
const usuarioDAO = new UsuarioDAO();

type Envio = {
    envioId: number,
    usuario: string,
    problema: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: string
};

/*
Recibe el json que llego por rabbitMQ y actualiza los diagramas correspondientes
*/
export default async function routerEmitter(envio:Envio) {
    //se obtiene el socket para emitir los eventos
    const io = getIO();

    //se procesa el envio y se guarda en la base de datos
    await cargarEnvio(envio);

    //se actualizan los diagramas de estadisticas de problemas
    io.emit(formatEvent(envio.problema, EventType.PROBLEMA_RESULTADOS), await problemaDAO.getResultados(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.PROBLEMA_LENGUAJES), await problemaDAO.getLenguajes(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.ENVIOS_PROBLEMA), await problemaDAO.getNumEnvios(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.TIEMPO_PROM_PROBLEMA), await problemaDAO.getTiempoPromedio(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.MEJOR_TIEMPO_PROBLEMA), await problemaDAO.getMejorTiempo(envio.problema));

    //eventos para actualizar los diagramas de estadisticas de usuario
    io.emit(formatEvent(envio.usuario, EventType.USUARIO_RESULTADOS), await usuarioDAO.getResultados(envio.usuario));
    io.emit(formatEvent(envio.usuario, EventType.USUARIO_LENGUAJES), await usuarioDAO.getLenguajes(envio.usuario));
}