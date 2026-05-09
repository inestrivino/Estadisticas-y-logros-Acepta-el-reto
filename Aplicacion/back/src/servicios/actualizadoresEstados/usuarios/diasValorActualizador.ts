import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import usuarioService from "../../usuarioService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class DiasValorCalculador extends ActualizadorUsuario {

    id = CampoUsuario.DIAS_VALOR;
    version = 1;

    estadoVacio(estado: EstadoUsuario): void {
        estado.diasValor = new Map();
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        const diasValor = await usuarioService.getDiasValor(usuario);
        estado.diasValor = new Map(diasValor.map(d => [d.timestamp, d.value]));
    }

    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void {
        //TODO filtrar envios anteriores al ultimo año
        estado.diasValor!.set(envio.fecha, (estado.diasValor!.get(envio.fecha) ?? 0) + 1);
    }

    modificado(estado: EstadoUsuario): Partial<EstadoUsuario> {
        return {
            diasValor: new Map(estado.diasValor),
        };
    }
}

export default new DiasValorCalculador();
