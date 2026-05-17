import { EnvioProcesado } from "../../types/envios/envioProcesado.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { CampoUsuarioKey } from "../../types/estados/camposEstadoUsuario.js";

/**
 * Actualizador de un fragmento del estado del usuario.
 * Cada implementacion declara los campos del estado de los que se hace cargo
 * y la logica para inicializarlos, cargarlos desde la base de datos y actualizarlos
 * con un nuevo envio.
 */
export abstract class ActualizadorUsuario {

    //identificador unico del actualizador, usado para versionado y checkpoints
    abstract id: CampoUsuarioKey;

    //version actual del actualizador, se compara con la version aplicada para decidir si recalcular
    abstract version: number;

    inicializar(estado: EstadoUsuario): void {
        (estado[this.id] as any) = true;
        this.estadoVacio(estado);
    }

    //devuelve los campos iniciales del estado de los que se encarga este actualizador
    abstract estadoVacio(estado: EstadoUsuario): void;

    //rellena los campos del estado con los datos actuales almacenados en la base de datos
    abstract cargarInicial(estado: EstadoUsuario, usuario: string): Promise<void>;

    //actualiza los campos del estado al recibir un nuevo envio
    abstract actualizar(estado: EstadoUsuario, envio: EnvioProcesado): void;
}
