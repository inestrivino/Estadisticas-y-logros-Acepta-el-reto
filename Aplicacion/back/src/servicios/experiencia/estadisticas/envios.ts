import { EstadisticaExperiencia } from "../estadistica.js";
import usuarioDAO from "../../../dao/usuarioDAO.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";

/**
 * Aporta 1 punto de XP por cada envio nuevo y persiste por mes el numero de envios
 * realizados en ese mes como score acumulado del usuario.
 */
export const enviosEstadistica: EstadisticaExperiencia = {

    id: CampoUsuario.NUM_ENVIOS,

    calcularXP(estadoInicial, estadoFinal) {
        return ((estadoFinal.numEnvios ?? 0) - (estadoInicial.numEnvios ?? 0)) * 1;
    },

    registrarMes(pipeline, usuario, mes, anterior, finalMes) {
        const enviosNuevos = (finalMes.numEnvios ?? 0) - (anterior.numEnvios ?? 0);
        if (enviosNuevos > 0)
            usuarioDAO.registrarNumEnviosMes(pipeline, usuario, mes, enviosNuevos);
    },

    async borrarMes() {
        await usuarioDAO.borrarNumEnviosMes();
    },

    async calcularXPMes(mes) {
        const envios = await usuarioDAO.getNumEnviosMes(mes);
        const xp = new Map<string, number>();
        for (const [usuario, cantidad] of envios)
            xp.set(usuario, cantidad * 1);
        return xp;
    }
};
