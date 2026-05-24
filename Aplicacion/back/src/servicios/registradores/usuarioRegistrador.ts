import { EstadoUsuario } from '../../types/estados/estadoUsuario.js';
import { CampoUsuarioKey } from '../../types/estados/camposEstadoUsuario.js';
import { Pipeline } from '../../dao/DAO.js';

export interface RegistradorUsuario {

    //centinela del calculador cuyos campos persiste este registrador
    id: CampoUsuarioKey;

    //encola en el pipeline el guardado del campo gestionado por este registrador
    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void;

    //borra todas las claves de Redis que gestiona este registrador
    borrar(usuarios: string[]): Promise<void>;
}
