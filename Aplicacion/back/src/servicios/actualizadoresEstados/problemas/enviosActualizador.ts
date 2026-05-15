import { ActualizadorProblema } from "../problemaActualizadorInterface.js";
import { EstadoProblema } from "../../../types/estados/estadoProblema.js";
import { CampoProblema } from "../../../types/estados/camposEstadoProblema.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";
import problemaService from "../../problemaService.js";

class EnviosActualizador extends ActualizadorProblema {

    id = CampoProblema.ENVIOS;
    version = 4;

    estadoVacio(estado: EstadoProblema): void {
        estado.envios = 0;
        estado.enviosAC = 0;
    }

    async cargarInicial(estado: EstadoProblema, problema: string): Promise<void> {
        estado.envios = await problemaService.getNumEnvios(problema);
        estado.enviosAC = await problemaService.getNumEnviosAC(problema);
    }

    actualizar(estado: EstadoProblema, envio: EnvioProcesado): void {
        estado.envios!++;
        if (envio.resultado === "AC")
            estado.enviosAC!++;
    }
}

export default new EnviosActualizador();
