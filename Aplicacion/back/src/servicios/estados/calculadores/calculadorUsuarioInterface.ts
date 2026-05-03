import { EnvioProcesado } from "../../../types/envios/envioProcesado.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";

/**
 * Calculador de un fragmento del estado del usuario.
 * Cada implementacion declara los campos del estado de los que se hace cargo
 * y la logica para inicializarlos, cargarlos desde la base de datos y actualizarlos
 * con un nuevo envio. Es responsable tambien de clonar sus campos mutables (Map/Set/array)
 * cuando se devuelve una copia del estado.
 */
export interface CalculadorUsuario {

    //devuelve los campos iniciales del estado de los que se encarga este calculador
    estadoVacio(): Partial<EstadoUsuario>;

    //rellena los campos del estado con los datos actuales almacenados en la base de datos
    cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void>;

    //actualiza los campos del estado al recibir un nuevo envio
    actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void;

    //clona los campos mutables propios para evitar referencias compartidas
    //si solo trabaja con tipos primitivos no es necesario implementarlo
    clonar?(estado: EstadoUsuario): Partial<EstadoUsuario>;
}
