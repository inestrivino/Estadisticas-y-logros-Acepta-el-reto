import { getIO } from "./socketInit.js"
import { EventType, formatProblemEvent } from "shared";
import { cargarEnvio } from "../db/cargarDatos.js";
import ProblemaDAO from "../dao/problemaDAO.js";
import UsuarioDAO from "src/dao/usuarioDAO.js";

const problemaDAO = new ProblemaDAO();
const usuarioDAO = new UsuarioDAO();

type Envio = {
    "envioId": number,
    "usuario": string,
    "problema": string,
    "categoria": string,
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
export default async function routerEmitter(envio:Envio) {
    //se obtiene el socket para emitir los eventos
    const io = getIO();

    //se procesa el envio y se guarda en la base de datos
    await cargarEnvio(envio);

    //se actualizan los diagramas de estadisticas de problemas
    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_PROBLEMAS), envio.resultado);
    io.emit(formatProblemEvent(envio.problema, EventType.DIAGRAMA_LENGUAJES), envio.lenguaje);
    io.emit(formatProblemEvent(envio.problema, EventType.ENVIOS_PROBLEMA), await problemaDAO.getNumEnvios(envio.problema));
    io.emit(formatProblemEvent(envio.problema, EventType.TIEMPO_PROM_PROBLEMA), await problemaDAO.getTiempoPromedio(envio.problema));
    io.emit(formatProblemEvent(envio.problema, EventType.MEJOR_TIEMPO_PROBLEMA), await problemaDAO.getMejorTiempo(envio.problema));

    //se actualizan los logros del usuario
    io.emit(formatProblemEvent(envio.usuario, EventType.LOGROS_USUARIO_NIVEL), await usuarioDAO.getLogrosUsuario(envio.usuario, "nivel"));
    io.emit(formatProblemEvent(envio.usuario, EventType.LOGROS_USUARIO_CATEGORIA), await usuarioDAO.getLogrosUsuario(envio.usuario, "categoria"));

}