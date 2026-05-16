import { CalculadorProblema } from "../calculadorProblemaInterface.js";
import { EstadoProblema } from "../../../types/estados/estadoProblema.js";
import { CampoProblema } from "../../../types/estados/camposEstadoProblema.js";
import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";
import problemaService from "../../problemaService.js";

class LenguajesActualizador extends CalculadorProblema {

    id = CampoProblema.LENGUAJES;
    version = 1;

    estadoVacio(estado: EstadoProblema): void {
        estado.lenguajes = new Map();
    }

    async cargarInicial(estado: EstadoProblema, problema: string): Promise<void> {
        const lenguajes = await problemaService.getLenguajes(problema);
        estado.lenguajes = new Map(lenguajes.map(l => [l.name, l.value]));
    }

    actualizar(estado: EstadoProblema, envio: EnvioProcesado): void {
        estado.lenguajes!.set(envio.lenguaje, (estado.lenguajes!.get(envio.lenguaje) ?? 0) + 1);
    }

    clonar(estado: EstadoProblema): Partial<EstadoProblema> {
        return { lenguajes: new Map(estado.lenguajes) };
    }
}

export default new LenguajesActualizador();
