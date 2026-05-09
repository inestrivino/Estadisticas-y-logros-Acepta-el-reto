import { RegistradorProblema, Pipeline } from '../problemaRegistradorInterface.js';
import { EstadoProblema } from '../../../types/estados/estadoProblema.js';
import { CampoProblema } from '../../../types/estados/camposEstadoProblema.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorLenguajes: RegistradorProblema = {

    id: CampoProblema.LENGUAJES,

    registrar(pipeline: Pipeline, problema: string, estado: EstadoProblema): void {
        const datos: Record<string, string> = {};
        for (const [k, v] of estado.lenguajes!)
            datos[k] = String(v);
        if (Object.keys(datos).length > 0)
            pipeline.hSet(`problema:${problema}:lenguajes`, datos);
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['problema:*:lenguajes']);
    }
};

export default registradorLenguajes;
