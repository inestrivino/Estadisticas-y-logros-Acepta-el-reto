import { EstadisticaExperiencia } from "../estadistica.js";
import usuarioDAO from "../../../dao/usuarioDAO.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";

/**
 * Aporta 15 puntos de XP por cada problema nuevo resuelto con AC y persiste por mes
 * el set de problemas resueltos por el usuario en ese mes.
 */
export const problemasACEstadistica: EstadisticaExperiencia = {

    id: CampoUsuario.PROBLEMAS,

    calcularXP(estadoInicial, estadoFinal) {
        return ((estadoFinal.problemasAC?.size ?? 0) - (estadoInicial.problemasAC?.size ?? 0)) * 15;
    },

    registrarMes(pipeline, usuario, mes, anterior, finalMes) {
        const antes = anterior.problemasAC ?? new Set<string>();
        const ahora = finalMes.problemasAC ?? new Set<string>();
        let nuevos = 0;
        for (const p of ahora) if (!antes.has(p)) nuevos++;
        if (nuevos > 0)
            usuarioDAO.registrarProblemasACMes(pipeline, usuario, mes, nuevos);
    },

    async borrarMes() {
        await usuarioDAO.borrarProblemasACMes();
    },

    async borrarMesEspecifico(mes) {
        await usuarioDAO.borrarProblemasACMesEspecifico(mes);
    },

    async calcularXPMes(mes) {
        const problemas = await usuarioDAO.getProblemasACMes(mes);
        const xp = new Map<string, number>();
        for (const [usuario, cantidad] of problemas)
            xp.set(usuario, cantidad * 15);
        return xp;
    }
};
