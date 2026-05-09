import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import usuarioService from "../../usuarioService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class NumEnviosCalculador extends ActualizadorUsuario {

    id = CampoUsuario.NUM_ENVIOS;
    version = 3;

    estadoVacio(estado: EstadoUsuario): void {
        estado.numEnvios = 0;
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        estado.numEnvios = await usuarioService.getNumEnvios(usuario);
    }

    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void {
        estado.numEnvios!++;
    }
}

export default new NumEnviosCalculador();
