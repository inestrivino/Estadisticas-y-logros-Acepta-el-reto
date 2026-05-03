import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import usuarioService from "../../../usuarios/estadisticasUsuarioBaseService.js";

const numEnviosCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        numEnvios: 0,
    }),

    cargarInicial: async (estado, usuario) => {
        estado.numEnvios = await usuarioService.getNumEnvios(usuario);
    },

    actualizar: (estado, envio) => {
        estado.numEnvios++;
    },
};

export default numEnviosCalculador;
