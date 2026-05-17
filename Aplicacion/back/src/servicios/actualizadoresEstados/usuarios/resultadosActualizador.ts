import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import usuarioService from "../../usuarioService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class ResultadosActualizador extends ActualizadorUsuario {

    id = CampoUsuario.RESULTADOS;
    version = 1;

    estadoVacio(estado: EstadoUsuario): void {
        estado.resultados = new Map();
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        const resultados = await usuarioService.getResultados(usuario);
        estado.resultados = new Map(resultados.map(r => [r.name, r.value]));
    }

    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void {
        estado.resultados!.set(envio.resultado, (estado.resultados!.get(envio.resultado) ?? 0) + 1);
    }

}

export default new ResultadosActualizador();
