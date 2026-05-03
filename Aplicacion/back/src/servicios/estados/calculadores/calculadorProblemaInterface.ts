import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";
import { EstadoProblema } from "../../../types/estados/estadoProblema.js";

/**
 * Calculador de un fragmento del estado del problema.
 * Cada implementacion declara los campos del estado de los que se hace cargo
 * y la logica para inicializarlos, cargarlos desde la base de datos y actualizarlos
 * con un nuevo envio. Es responsable tambien de clonar sus campos mutables (Map/Set/array)
 * cuando se devuelve una copia del estado.
 */
export interface CalculadorProblema {

    //devuelve los campos iniciales del estado de los que se encarga este calculador
    estadoVacio(): Partial<EstadoProblema>;

    //rellena los campos del estado con los datos actuales almacenados en la base de datos
    cargarInicial(estado: EstadoProblema, problema: string): Promise<void>;

    //actualiza los campos del estado al recibir un nuevo envio
    actualizar(estado: EstadoProblema, envio: EnvioProcesado): void;

    //clona los campos mutables propios para evitar referencias compartidas
    //si solo trabaja con tipos primitivos no es necesario implementarlo
    clonar?(estado: EstadoProblema): Partial<EstadoProblema>;
}
