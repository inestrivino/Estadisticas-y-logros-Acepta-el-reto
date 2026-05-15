import { ActualizadorProblema } from "../problemaActualizadorInterface.js";
import { EstadoProblema } from "../../../types/estados/estadoProblema.js";
import { CampoProblema } from "../../../types/estados/camposEstadoProblema.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";
import problemaService from "../../problemaService.js";

class TiemposActualizador extends ActualizadorProblema {

    id = CampoProblema.TIEMPOS;
    version = 1;

    estadoVacio(estado: EstadoProblema): void {
        estado.mejorTiempo = Infinity;
        estado.tiempoTotal = 0;
        estado.tiemposOrdenados = [];
        estado.posUltimoEnvio = -1;
        estado.tiemposEnvios = new Map();
    }

    async cargarInicial(estado: EstadoProblema, problema: string): Promise<void> {
        estado.mejorTiempo = await problemaService.getMejorTiempo(problema);
        estado.tiempoTotal = await problemaService.getTiempoTotal(problema);
        estado.tiemposOrdenados = await problemaService.getTiemposOrdenados(problema);
    }

    actualizar(estado: EstadoProblema, envio: EnvioProcesado): void {
        
        //si el envio no es un acierto se vuelve
        if (envio.resultado !== "AC")
            return;

        //se suma el tiempoTotal para sacar el tiempo medio
        estado.tiempoTotal! += envio.tiempo;

        //si menor que el mejor tiempo pasa a ser el nuevo mejor tiempo
        if (envio.tiempo < (estado.mejorTiempo ?? Infinity)) {
            estado.mejorTiempo = envio.tiempo;
        }

        //se inserta el tiempo en el array ordenado para el ranking
        const pos = estado.tiemposOrdenados!.findIndex(t => t > envio.tiempo);
        if (pos === -1)
            estado.tiemposOrdenados!.push(envio.tiempo);
        else
            estado.tiemposOrdenados!.splice(pos, 0, envio.tiempo);

        estado.tiemposEnvios!.set(envio.envioId, envio.tiempo);
        estado.posUltimoEnvio = pos;
    }

    clonar(estado: EstadoProblema): Partial<EstadoProblema> {
        return {
            tiemposOrdenados: [...estado.tiemposOrdenados!],
            //tiemposEnvios no se clona porque se rellena al procesar el bloque
        };
    }
}

export default new TiemposActualizador();
