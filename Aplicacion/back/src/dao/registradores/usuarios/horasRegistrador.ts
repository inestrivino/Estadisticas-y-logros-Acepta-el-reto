import { RegistradorUsuario, Pipeline } from '../usuarioRegistradorInterface.js';
import { EstadoUsuario } from '../../../types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorHoras: RegistradorUsuario = {

    id: CampoUsuario.HORAS,

    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        if (estado.horas!.size > 0)
            pipeline.sAdd(`usuario:${usuario}:horas`, Array.from(estado.horas!).map(String));
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['usuario:*:horas']);
    }
};

export default registradorHoras;
