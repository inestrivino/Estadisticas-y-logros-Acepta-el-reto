import { getIO } from "./socketInit.js"
import { EventType, formatEvent } from "shared";
//import { cargarEnvio } from "../db/cargarDatos.js";
import ProblemaDAO from "../dao/problemaDAO.js";
import UsuarioService from "../servicios/usuarioService.js";
import { Envio } from "../types/envio.js";

//TODO poner aqui el servicio en vez del DAO
const problemaDAO = new ProblemaDAO();
const usuarioService = new UsuarioService();

/*
Recibe el json que llego por rabbitMQ y actualiza los diagramas correspondientes
*/
export default async function routerEmitter(envio:Envio) {
    console.log("Emite eventos para recargar los componentes");

    //se obtiene el socket para emitir los eventos
    const io = getIO();

    //se actualizan los diagramas de estadisticas de problemas
    io.emit(formatEvent(envio.problema, EventType.PROBLEMA_RESULTADOS), await problemaDAO.getResultados(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.PROBLEMA_LENGUAJES), await problemaDAO.getLenguajes(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.ENVIOS_PROBLEMA), await problemaDAO.getNumEnvios(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.TIEMPO_PROM_PROBLEMA), await problemaDAO.getTiempoPromedio(envio.problema));
    io.emit(formatEvent(envio.problema, EventType.MEJOR_TIEMPO_PROBLEMA), await problemaDAO.getMejorTiempo(envio.problema));

    //eventos para actualizar los diagramas de estadisticas de usuario
    io.emit(formatEvent(envio.usuario, EventType.USUARIO_RESULTADOS), await usuarioService.getResultados(envio.usuario));
    io.emit(formatEvent(envio.usuario, EventType.USUARIO_LENGUAJES), await usuarioService.getLenguajes(envio.usuario));
    io.emit(formatEvent(envio.usuario, EventType.USUARIO_PARTICIPACION), await usuarioService.getEnviosAnio(envio.usuario));

    //se actualizan los logros del usuario
    io.emit(formatEvent(envio.usuario, EventType.LOGROS_USUARIO_NIVEL), await usuarioService.getLogrosUsuario(envio.usuario, "nivel"));
    io.emit(formatEvent(envio.usuario, EventType.LOGROS_USUARIO_CATEGORIA), await usuarioService.getLogrosUsuario(envio.usuario, "categoria"));
}