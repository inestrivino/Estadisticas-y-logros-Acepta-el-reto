import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import usuarioService from "../../../usuarios/estadisticasUsuarioBaseService.js";

const resultadosCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        resultados: new Map(),
    }),

    cargarInicial: async (estado, usuario) => {
        const resultados = await usuarioService.getResultados(usuario);
        estado.resultados = new Map(resultados.map(r => [r.name, r.value]));
    },

    actualizar: (estado, envio) => {
        estado.resultados.set(envio.resultado, (estado.resultados.get(envio.resultado) ?? 0) + 1);
    },

    clonar: (estado) => ({
        resultados: new Map(estado.resultados),
    }),
};

export default resultadosCalculador;
