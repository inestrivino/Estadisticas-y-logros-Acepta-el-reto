import { RegistradorUsuario, Pipeline } from '../usuarioRegistradorInterface.js';
import { EstadoUsuario } from '../../../types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorProblemas: RegistradorUsuario = {

    id: CampoUsuario.PROBLEMAS,

    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        if (estado.problemasAC!.size > 0)
            pipeline.sAdd(`usuario:${usuario}:problemasAC`, Array.from(estado.problemasAC!));
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['usuario:*:problemasAC']);
    }
};

export default registradorProblemas;
