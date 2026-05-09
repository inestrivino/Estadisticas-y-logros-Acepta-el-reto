import redisClient from '../../redis/redisClient.js';
import { EstadoUsuario } from '../../types/estados/estadoUsuario.js';
import { CampoUsuarioKey } from '../../types/estados/camposEstadoUsuario.js';

export type Pipeline = ReturnType<typeof redisClient.multi>;

export interface RegistradorUsuario {

    //centinela del calculador cuyos campos persiste este registrador
    id: CampoUsuarioKey;

    //escribe en el pipeline las claves de Redis correspondientes al estado del usuario
    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void;

    //borra todas las claves de Redis que gestiona este registrador
    borrar(): Promise<void>;
}
