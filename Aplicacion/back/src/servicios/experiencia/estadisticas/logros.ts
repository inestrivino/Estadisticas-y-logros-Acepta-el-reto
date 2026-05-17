import { EstadisticaExperiencia } from "../estadistica.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import logrosDAO from "../../../dao/logrosDAO.js";

//multiplicadores de XP por nivel de logro
const XP_LOGRO: Record<NivelLogro, number> = {
    [NivelLogro.BRONCE]: 20,
    [NivelLogro.PLATA]: 40,
    [NivelLogro.ORO]: 60,
};

/**
 * Aporta XP por cada logro nuevo segun su nivel y persiste por mes los nombres
 * de los logros obtenidos por el usuario en ese mes.
 */
export const logrosEstadistica: EstadisticaExperiencia = {

    id: "logros",

    calcularXP(_inicial, _final, nuevosLogros) {
        let total = 0;
        for (const logro of nuevosLogros)
            total += XP_LOGRO[logro.nivel] ?? 0;
        return total;
    },

    registrarMes(pipeline, usuario, mes, _anterior, _finalMes, nuevosLogrosMes) {
        if (nuevosLogrosMes.size === 0) return;
        const nombres = [...nuevosLogrosMes].map(l => l.nombre);
        logrosDAO.registrarLogrosUsuarioMes(pipeline, usuario, mes, nombres);
    }
};
