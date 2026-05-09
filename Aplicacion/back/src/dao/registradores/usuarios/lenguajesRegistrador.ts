import { RegistradorUsuario, Pipeline } from '../usuarioRegistradorInterface.js';
import { EstadoUsuario } from '../../../types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorLenguajes: RegistradorUsuario = {

    id: CampoUsuario.LENGUAJES,

    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        const conteo: Record<string, string> = {};
        for (const [k, v] of estado.lenguajesConteo!)
            conteo[k] = String(v);
        if (Object.keys(conteo).length > 0)
            pipeline.hSet(`usuario:${usuario}:lenguajes`, conteo);

        const ac: Record<string, string> = {};
        for (const [k, v] of estado.lenguajesAC!)
            ac[k] = String(v);
        if (Object.keys(ac).length > 0)
            pipeline.hSet(`usuario:${usuario}:lenguajesAC`, ac);

        for (const [lenguaje, problemas] of estado.lenguajesProblemasResueltos!) {
            if (problemas.size > 0)
                pipeline.sAdd(`usuario:${usuario}:lenguaje:${lenguaje}`, Array.from(problemas));
        }
    },

    async borrar(): Promise<void> {
        await borrarPatrones([
            'usuario:*:lenguajes',
            'usuario:*:lenguajesAC',
            'usuario:*:lenguaje:*',
        ]);
    }
};

export default registradorLenguajes;
