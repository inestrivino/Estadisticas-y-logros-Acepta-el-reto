import { ActualizadorXP } from "./xpActualizadorInterface.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../types/estados/camposEstadoUsuario.js";
import { NivelLogro } from "../../types/enums/nivelLogro.js";
import logrosService from "../logrosService.js";

class LogrosActualizadorXP extends ActualizadorXP {

    id = CampoUsuario.LOGROS;
    version = 1;

    /**
     * Calcula los XP obtenidos por los logros nuevos conseguidos en el bloque.
     * @param estadoIni - Estado del usuario antes del bloque.
     * @param estadoFin - Estado del usuario despues del bloque.
     * @returns XP total por logros nuevos del bloque.
     */
    actualizar(estadoIni: EstadoUsuario, estadoFin: EstadoUsuario): number {
        const logrosNuevos = [...(estadoFin.logros ?? [])].filter(l => !estadoIni.logros?.has(l));
        let xp = 0;
        for (const logro of logrosNuevos.map(l => logrosService.getLogroByName(l))) {
            if (logro !== undefined)
                xp += this.getXPPorNivelLogro(logro.nivel);
        }
        return xp;
    }

    private getXPPorNivelLogro(nivel: NivelLogro): number {
        switch (nivel) {
            case NivelLogro.BRONCE: return 20;
            case NivelLogro.PLATA:  return 40;
            case NivelLogro.ORO:    return 60;
        }
    }
}

export default new LogrosActualizadorXP();
