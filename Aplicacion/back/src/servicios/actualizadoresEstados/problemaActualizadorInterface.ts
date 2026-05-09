import { EnvioProcesado } from "../../types/envios/envioProcesado.js";
import { EstadoProblema } from "../../types/estados/estadoProblema.js";
import { CampoProblemaKey } from "../../types/estados/camposEstadoProblema.js";

/**
 * Actualizador de un fragmento del estado del problema.
 * Cada implementacion declara los campos del estado de los que se hace cargo
 * y la logica para inicializarlos, cargarlos desde la base de datos y actualizarlos
 * con un nuevo envio. Es responsable tambien de clonar sus campos mutables (Map/Set/array)
 * cuando se devuelve una copia del estado.
 */
export abstract class ActualizadorProblema {

    //identificador unico del actualizador, usado para versionado y checkpoints
    abstract id: CampoProblemaKey;

    //version actual del actualizador, se compara con la version aplicada para decidir si recalcular
    abstract version: number;

    inicializar(estado: EstadoProblema): void {
        (estado[this.id] as any) = true;
        this.estadoVacio(estado);
    }

    //devuelve los campos iniciales del estado de los que se encarga este actualizador
    abstract estadoVacio(estado: EstadoProblema): void;

    //rellena los campos del estado con los datos actuales almacenados en la base de datos
    abstract cargarInicial(estado: EstadoProblema, problema: string): Promise<void>;

    //actualiza los campos del estado al recibir un nuevo envio
    abstract actualizar(estado: EstadoProblema, envio: EnvioProcesado): void;
}
