import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import usuarioService from "../../usuarioService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class HorasCalculador extends ActualizadorUsuario {

    id = CampoUsuario.HORAS;
    version = 1;

    estadoVacio(estado: EstadoUsuario): void {
        estado.horas = new Set();
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        estado.horas = new Set(await usuarioService.getHoras(usuario));
    }

    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void {
        estado.horas!.add(envio.hora);
    }

    modificado(estado: EstadoUsuario): Partial<EstadoUsuario> {
        return {
            horas: new Set(estado.horas),
        };
    }
}

export default new HorasCalculador();
