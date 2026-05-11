import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import logrosService from "../../logrosService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class LogrosCalculador extends ActualizadorUsuario {

    id = CampoUsuario.LOGROS;
    version = 1;

    estadoVacio(estado: EstadoUsuario): void {
        estado.logros = new Set();
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        estado.logros = new Set(await logrosService.getLogros(usuario));
    }

    //los logros nuevos los añade el propio servicio de logros al evaluar el envio
    actualizar(_estado: EstadoUsuario, _envio: EnvioProcesado): void { }

    modificado(estado: EstadoUsuario): Partial<EstadoUsuario> {
        return {
            logros: new Set(estado.logros),
        };
    }
}

export default new LogrosCalculador();
