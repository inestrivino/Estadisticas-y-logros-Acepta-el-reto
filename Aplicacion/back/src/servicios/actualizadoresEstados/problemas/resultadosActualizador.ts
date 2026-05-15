import { ActualizadorProblema } from "../problemaActualizadorInterface.js";
import { EstadoProblema } from "../../../types/estados/estadoProblema.js";
import { CampoProblema } from "../../../types/estados/camposEstadoProblema.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";
import problemaService from "../../problemaService.js";

class ResultadosActualizador extends ActualizadorProblema {

    id = CampoProblema.RESULTADOS;
    version = 1;

    estadoVacio(estado: EstadoProblema): void {
        estado.resultados = new Map();
    }

    async cargarInicial(estado: EstadoProblema, problema: string): Promise<void> {
        const resultados = await problemaService.getResultados(problema);
        estado.resultados = new Map(resultados.map(r => [r.name, r.value]));
    }

    actualizar(estado: EstadoProblema, envio: EnvioProcesado): void {
        estado.resultados!.set(envio.resultado, (estado.resultados!.get(envio.resultado) ?? 0) + 1);
    }

    clonar(estado: EstadoProblema): Partial<EstadoProblema> {
        return { resultados: new Map(estado.resultados) };
    }
}

export default new ResultadosActualizador();
