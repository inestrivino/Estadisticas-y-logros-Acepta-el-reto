import { RegistradorUsuario, Pipeline } from '../usuarioRegistradorInterface.js';
import { EstadoUsuario } from '../../../types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorRachas: RegistradorUsuario = {

    id: CampoUsuario.RACHAS,

    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        pipeline.set(`usuario:${usuario}:fechaUltimoEnvio`, String(estado.ultimoDiaEnvio));
        pipeline.set(`usuario:${usuario}:rachaEnviosAC`,    String(estado.rachaEnviosAC));
        pipeline.set(`usuario:${usuario}:rachaEnviosACMax`, String(estado.rachaEnviosACMax));
        pipeline.set(`usuario:${usuario}:rachaDiasEnvio`,   String(estado.rachaDiasEnvio));
        pipeline.set(`usuario:${usuario}:rachaDiasEnvioMax`,String(estado.rachaDiasEnvioMax));
    },

    async borrar(): Promise<void> {
        await borrarPatrones([
            'usuario:*:fechaUltimoEnvio',
            'usuario:*:rachaEnviosAC',
            'usuario:*:rachaEnviosACMax',
            'usuario:*:rachaDiasEnvio',
            'usuario:*:rachaDiasEnvioMax',
        ]);
    }
};

export default registradorRachas;
