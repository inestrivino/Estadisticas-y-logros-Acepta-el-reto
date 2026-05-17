import { getIO } from "./socketInit.js"
import { EventType, formatEvent } from "shared";
import problemaDAO from "../dao/problemaDAO.js";
import usuarioService from "../servicios/usuarioService.js";
import logrosService from "../servicios/logrosService.js";
import { EnvioProcesado } from "../types/envios/envioProcesado.js";
import xpService from "../servicios/xpService.js";

/*
Recibe el json que llego por rabbitMQ y actualiza los diagramas correspondientes
*/
export async function routerEmitter(envio: EnvioProcesado) {

    console.log("Emite eventos para recargar los componentes");

    enviarEventosOtros();

    enviarEventosProblemas(envio.problema);

    enviarEventosUsuarios(envio.usuario);
}

export async function conjuntoEmitter(problemas: Set<string>, usuarios: Set<string>, porcentaje: number) {

    enviarEventosOtros(porcentaje);

    for (const problema of problemas) {
        enviarEventosProblemas(problema);
    }

    for (const usuario of usuarios) {
        enviarEventosUsuarios(usuario);
    }
}

async function enviarEventosUsuarios(usuario: string) {
    
    const io = getIO();

    io.emit(EventType.ACTUALIZACION_RANKING);

    //eventos para actualizar los diagramas de estadisticas de usuario
    io.emit(formatEvent(usuario, EventType.USUARIO_RESULTADOS), await usuarioService.getResultados(usuario));
    io.emit(formatEvent(usuario, EventType.USUARIO_LENGUAJES), await usuarioService.getLenguajes(usuario));
    io.emit(formatEvent(usuario, EventType.USUARIO_PARTICIPACION), await usuarioService.getEnviosAnio(usuario));
    io.emit(formatEvent(usuario, EventType.USUARIO_NUM_PROBLEMAS_RESUELTOS), await usuarioService.getNumProblemasResueltos(usuario));
    io.emit(formatEvent(usuario, EventType.USUARIO_RACHA_ACTUAL_ENVIOS_AC), await usuarioService.getRachaActualEnviosCorrectos(usuario));
    io.emit(formatEvent(usuario, EventType.USUARIO_RACHA_MAX_ENVIOS_AC), await usuarioService.getRachaEnviosCorrectosMax(usuario));
    io.emit(formatEvent(usuario, EventType.USUARIO_RACHA_ACTUAL_DIAS), await usuarioService.getRachaActualDiasEnviosConsecutivos(usuario));
    io.emit(formatEvent(usuario, EventType.USUARIO_RACHA_MAX_DIAS), await usuarioService.getRachaDiasEnviosConsecutivosMax(usuario));

    //se actualizan los logros del usuario
    io.emit(formatEvent(usuario, EventType.LOGROS_USUARIO_NIVEL), await logrosService.getLogrosUsuario(usuario, "nivel"));
    io.emit(formatEvent(usuario, EventType.LOGROS_USUARIO_CATEGORIA), await logrosService.getLogrosUsuario(usuario, "categoria"));
    io.emit(formatEvent(usuario, EventType.LOGROS_RECIENTES_USUARIO), await logrosService.getUltimosLogros(usuario));

    //se actualiza el nivel del usuario
    io.emit(formatEvent(usuario, EventType.USUARIO_NIVEL), await xpService.getNivelUsuario(usuario));

    //se actualiza el progreso de xp por mes
    io.emit(formatEvent(usuario, EventType.USUARIO_EXPERIENCIA_MES), await xpService.getXPUsuarioPorMes(usuario));
}

async function enviarEventosProblemas(problema: string) {
    
    const io = getIO();

    //se actualizan los diagramas de estadisticas de problemas
    io.emit(formatEvent(problema, EventType.PROBLEMA_RESULTADOS), await problemaDAO.getResultados(problema));
    io.emit(formatEvent(problema, EventType.PROBLEMA_LENGUAJES), await problemaDAO.getLenguajes(problema));
    io.emit(formatEvent(problema, EventType.ENVIOS_PROBLEMA), await problemaDAO.getNumEnvios(problema));
    io.emit(formatEvent(problema, EventType.TIEMPO_PROM_PROBLEMA), await problemaDAO.getTiempoPromedio(problema));
    io.emit(formatEvent(problema, EventType.MEJOR_TIEMPO_PROBLEMA), await problemaDAO.getMejorTiempo(problema));
}

async function enviarEventosOtros(porcentaje?: number) {

    const io = getIO();

    io.emit(EventType.ACTUALIZACION_RANKING);

    //para actualizar la barra de carga que te dice el porcentaje de envios que han cargado
    if (porcentaje !== undefined)
        io.emit(EventType.CARGA_ENVIOS, porcentaje);
}