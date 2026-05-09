import { RegistradorProblema, Pipeline } from '../problemaRegistradorInterface.js';
import { EstadoProblema } from '../../../types/estados/estadoProblema.js';
import { CampoProblema } from '../../../types/estados/camposEstadoProblema.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorTiempos: RegistradorProblema = {

    id: CampoProblema.TIEMPOS,

    registrar(pipeline: Pipeline, problema: string, estado: EstadoProblema): void {
        pipeline.set(`problema:${problema}:tiempoTotal`, String(estado.tiempoTotal));
        for (const [envioId, tiempo] of estado.tiemposEnvios!)
            pipeline.zAdd(`problema:${problema}:tiemposEnvios`, [{ score: tiempo, value: String(envioId) }]);
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['problema:*:tiempoTotal', 'problema:*:tiemposEnvios']);
    }
};

export default registradorTiempos;
