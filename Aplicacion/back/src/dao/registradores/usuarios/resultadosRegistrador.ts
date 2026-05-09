import { RegistradorUsuario, Pipeline } from '../usuarioRegistradorInterface.js';
import { EstadoUsuario } from '../../../types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorResultados: RegistradorUsuario = {

    id: CampoUsuario.RESULTADOS,

    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        const datos: Record<string, string> = {};
        for (const [k, v] of estado.resultados!)
            datos[k] = String(v);
        if (Object.keys(datos).length > 0)
            pipeline.hSet(`usuario:${usuario}:resultados`, datos);
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['usuario:*:resultados']);
    }
};

export default registradorResultados;
