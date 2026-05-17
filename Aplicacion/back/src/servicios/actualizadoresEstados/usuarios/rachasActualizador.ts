import { ActualizadorUsuario } from "../usuarioActualizadorInterface.js";
import usuarioService from "../../usuarioService.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";

class RachasActualizador extends ActualizadorUsuario {

    id = CampoUsuario.RACHAS;
    version = 1;

    estadoVacio(estado: EstadoUsuario): void {
        estado.rachaEnviosAC = 0;
        estado.rachaEnviosACMax = 0;
        estado.rachaDiasEnvio = 1;
        estado.rachaDiasEnvioMax = 1;
        estado.ultimoDiaEnvio = 0;
    }

    async cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void> {
        estado.rachaEnviosAC = await usuarioService.getRachaEnviosCorrectosActual(usuario);
        estado.rachaEnviosACMax = await usuarioService.getRachaEnviosCorrectosMax(usuario);

        estado.rachaDiasEnvio = await usuarioService.getRachaDiasEnviosConsecutivosActual(usuario); 
        estado.rachaDiasEnvioMax = await usuarioService.getRachaDiasEnviosConsecutivosMax(usuario);
        
        estado.ultimoDiaEnvio = await usuarioService.getUltimoEnvioUsuario(usuario);
    }

    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void {

        //RACHA DE DIAS
        //si el ultimo envio fue exactamente el dia anterior, se incrementa la racha de dias consecutivos
        //si fue hace mas de un dia, la racha se reinicia a 0
        if (estado.ultimoDiaEnvio! < (envio.fecha - 24 * 60 * 60))
            estado.rachaDiasEnvio = 1;
        else if (estado.ultimoDiaEnvio === envio.fecha - 24 * 60 * 60) {
            estado.rachaDiasEnvio!++;
        }

        if (estado.rachaDiasEnvio! > estado.rachaDiasEnvioMax!)
            estado.rachaDiasEnvioMax = estado.rachaDiasEnvio;

        estado.ultimoDiaEnvio = envio.fecha;

        //RACHA DE ENVIOS AC
        //un envio AC incrementa la racha actual, uno incorrecto la rompe a 0
        if (envio.resultado === "AC") {
            estado.rachaEnviosAC!++;
            if (estado.rachaEnviosAC! > estado.rachaEnviosACMax!)
                estado.rachaEnviosACMax = estado.rachaEnviosAC;
        }
        else {
            estado.rachaEnviosAC = 0;
        }
    }
}

export default new RachasActualizador();
