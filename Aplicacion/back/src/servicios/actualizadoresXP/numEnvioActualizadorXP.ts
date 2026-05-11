import { ActualizadorXP } from "./xpActualizadorInterface.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../types/estados/camposEstadoUsuario.js";

class NumEnviosActualizadorXP extends ActualizadorXP {

    id = CampoUsuario.NUM_ENVIOS;
    version = 1;

    actualizar(estadoIni: EstadoUsuario, estadoFin: EstadoUsuario): number {

        return 0;
    }
}

export default new NumEnviosActualizadorXP();