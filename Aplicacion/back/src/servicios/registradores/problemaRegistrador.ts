import { EstadoProblema } from '../../types/estados/estadoProblema.js';
import { CampoProblemaKey } from '../../types/estados/camposEstadoProblema.js';
import { Pipeline } from '../../dao/DAO.js';

export interface RegistradorProblema {

    //centinela del calculador cuyos campos persiste este registrador
    id: CampoProblemaKey;

    //encola en el pipeline el guardado del campo gestionado por este registrador
    registrar(pipeline: Pipeline, problema: string, estado: EstadoProblema): void;

    //borra todas las claves de Redis que gestiona este registrador
    borrar(problemas: string[]): Promise<void>;
}
