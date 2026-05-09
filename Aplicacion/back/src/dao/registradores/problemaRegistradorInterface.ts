import redisClient from '../../redis/redisClient.js';
import { EstadoProblema } from '../../types/estados/estadoProblema.js';
import { CampoProblemaKey } from '../../types/estados/camposEstadoProblema.js';

export type Pipeline = ReturnType<typeof redisClient.multi>;

export interface RegistradorProblema {

    //centinela del calculador cuyos campos persiste este registrador
    id: CampoProblemaKey;

    //escribe en el pipeline las claves de Redis correspondientes al estado del problema
    registrar(pipeline: Pipeline, problema: string, estado: EstadoProblema): void;

    //borra todas las claves de Redis que gestiona este registrador
    borrar(): Promise<void>;
}
