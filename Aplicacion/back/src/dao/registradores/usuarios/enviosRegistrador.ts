import { RegistradorUsuario, Pipeline } from '../usuarioRegistradorInterface.js';
import { EstadoUsuario } from '../../../types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorEnvios: RegistradorUsuario = {

    id: CampoUsuario.NUM_ENVIOS,

    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        pipeline.set(`usuario:${usuario}:envios`, String(estado.numEnvios));
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['usuario:*:envios']);
    }
};

export default registradorEnvios;
