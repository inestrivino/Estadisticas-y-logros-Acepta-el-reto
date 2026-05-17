import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import usuarioService from "../../usuarioService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class ProblemasActualizador extends ActualizadorUsuario {

    id = CampoUsuario.PROBLEMAS;
    version = 1;

    estadoVacio(estado: EstadoUsuario): void {
        estado.problemasAC = new Set();
        estado.problemasNoAC = new Set();
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        estado.problemasAC = new Set(await usuarioService.getProblemasResueltos(usuario));
    }

    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void {
        if (envio.resultado === "AC")
            estado.problemasAC!.add(envio.problema);
        else
            estado.problemasNoAC!.add(envio.problema);
    }

}

export default new ProblemasActualizador();
