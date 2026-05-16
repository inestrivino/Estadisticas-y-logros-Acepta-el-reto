import { EstadisticaExperiencia } from "../estadistica.js";
import usuarioDAO from "../../../dao/usuarioDAO.js";

/**
 * Aporta 15 puntos de XP por cada problema nuevo resuelto con AC y persiste por mes
 * el set de problemas resueltos por el usuario en ese mes.
 */
export const problemasACEstadistica: EstadisticaExperiencia = {

    id: "problemasAC",

    calcularXP(estadoInicial, estadoFinal) {
        return ((estadoFinal.problemasAC?.size ?? 0) - (estadoInicial.problemasAC?.size ?? 0)) * 15;
    },

    registrarMes(pipeline, usuario, mes, anterior, finalMes) {
        const antes = anterior.problemasAC ?? new Set<string>();
        const ahora = finalMes.problemasAC ?? new Set<string>();
        const nuevos = [...ahora].filter(p => !antes.has(p));
        if (nuevos.length > 0)
            usuarioDAO.registrarProblemasACMes(pipeline, usuario, mes, nuevos);
    }
};
