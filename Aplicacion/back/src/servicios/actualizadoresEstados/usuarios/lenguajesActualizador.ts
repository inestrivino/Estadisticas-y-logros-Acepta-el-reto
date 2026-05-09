import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import usuarioService from "../../usuarioService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class LenguajesCalculador extends ActualizadorUsuario {

    id = CampoUsuario.LENGUAJES;
    version = 1;

    estadoVacio(estado: EstadoUsuario): void {
        estado.lenguajes = new Set();
        estado.lenguajesConteo = new Map();
        estado.lenguajesAC = new Map();
        estado.lenguajesProblemasResueltos = new Map();
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        const lenguajes = await usuarioService.getLenguajes(usuario);
        estado.lenguajes = new Set(lenguajes.map(l => l.name));
        estado.lenguajesConteo = new Map(lenguajes.map(l => [l.name, l.value]));

        const lenguajesAC = await usuarioService.getLenguajesAC(usuario);
        estado.lenguajesAC = new Map(lenguajesAC.map(l => [l.name, l.value]));
    }

    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void {
        estado.lenguajes!.add(envio.lenguaje);
        estado.lenguajesConteo!.set(envio.lenguaje, (estado.lenguajesConteo!.get(envio.lenguaje) ?? 0) + 1);

        if (envio.resultado === "AC") {
            estado.lenguajesAC!.set(envio.lenguaje, (estado.lenguajesAC!.get(envio.lenguaje) ?? 0) + 1);

            if (!estado.lenguajesProblemasResueltos!.has(envio.lenguaje))
                estado.lenguajesProblemasResueltos!.set(envio.lenguaje, new Set());
            estado.lenguajesProblemasResueltos!.get(envio.lenguaje)!.add(envio.problema);
        }
    }

    modificado(estado: EstadoUsuario): Partial<EstadoUsuario> {
        return {
            lenguajes: new Set(estado.lenguajes),
            lenguajesConteo: new Map(estado.lenguajesConteo),
            lenguajesAC: new Map(estado.lenguajesAC),
            lenguajesProblemasResueltos: new Map(
                [...estado.lenguajesProblemasResueltos!].map(([l, s]) => [l, new Set(s)])
            ),
        };
    }
}

export default new LenguajesCalculador();
