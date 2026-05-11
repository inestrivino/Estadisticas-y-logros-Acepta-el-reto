import { ActualizadorXP } from "./xpActualizadorInterface.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../types/estados/camposEstadoUsuario.js";

class ResultadosActualizadorXP extends ActualizadorXP {

    id = CampoUsuario.RESULTADOS;
    version = 1;

    /**
     * Calcula los XP obtenidos por los envios del bloque, distinguiendo entre aciertos (AC) y el resto.
     * @param estadoIni - Estado del usuario antes del bloque.
     * @param estadoFin - Estado del usuario despues del bloque.
     * @returns XP total por envios del bloque.
     */
    actualizar(estadoIni: EstadoUsuario, estadoFin: EstadoUsuario): number {
        const acFinal = estadoFin.resultados?.get("AC") ?? 0;
        const acInicial = estadoIni.resultados?.get("AC") ?? 0;
        const enviosAC = acFinal - acInicial;

        const totalEnvios = (estadoFin.numEnvios ?? 0) - (estadoIni.numEnvios ?? 0);
        const enviosNoAC = totalEnvios - enviosAC;

        return enviosAC * 15 + enviosNoAC * 1;
    }
}

export default new ResultadosActualizadorXP();