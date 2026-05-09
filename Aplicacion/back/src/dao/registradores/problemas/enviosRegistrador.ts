import { RegistradorProblema, Pipeline } from '../problemaRegistradorInterface.js';
import { EstadoProblema } from '../../../types/estados/estadoProblema.js';
import { CampoProblema } from '../../../types/estados/camposEstadoProblema.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorEnvios: RegistradorProblema = {

    id: CampoProblema.ENVIOS,

    registrar(pipeline: Pipeline, problema: string, estado: EstadoProblema): void {
        pipeline.set(`problema:${problema}:envios`, String(estado.envios));
        pipeline.set(`problema:${problema}:enviosAC`, String(estado.enviosAC));
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['problema:*:envios', 'problema:*:enviosAC']);
    }
};

export default registradorEnvios;
