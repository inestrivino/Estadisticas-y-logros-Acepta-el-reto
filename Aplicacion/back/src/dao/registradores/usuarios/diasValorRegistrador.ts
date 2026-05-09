import { RegistradorUsuario, Pipeline } from '../usuarioRegistradorInterface.js';
import { EstadoUsuario } from '../../../types/estados/estadoUsuario.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import { borrarPatrones } from '../borrarPatrones.js';

const registradorDiasValor: RegistradorUsuario = {

    id: CampoUsuario.DIAS_VALOR,

    registrar(pipeline: Pipeline, usuario: string, estado: EstadoUsuario): void {
        for (const [ts, cantidad] of estado.diasValor!) {
            pipeline.hSet(`usuario:${usuario}:diasValor`, String(ts), String(cantidad));
            pipeline.zAdd(`usuario:${usuario}:dias`, [{ score: ts, value: String(ts) }]);
            pipeline.sAdd(`timestamp:${ts}`, String(usuario));
            pipeline.zAdd(`timestamps`, [{ score: ts, value: String(ts) }]);
        }
    },

    async borrar(): Promise<void> {
        await borrarPatrones(['usuario:*:diasValor', 'usuario:*:dias']);
    }
};

export default registradorDiasValor;
