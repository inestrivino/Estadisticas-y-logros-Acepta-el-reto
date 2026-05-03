import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import usuarioService from "../../../usuarios/estadisticasUsuarioBaseService.js";

const horasCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        horas: new Set(),
    }),

    cargarInicial: async (estado, usuario) => {
        estado.horas = new Set(await usuarioService.getHoras(usuario));
    },

    actualizar: (estado, envio) => {
        estado.horas.add(envio.hora);
    },

    clonar: (estado) => ({
        horas: new Set(estado.horas),
    }),
};

export default horasCalculador;
