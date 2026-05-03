import { CalculadorProblema } from "../calculadorProblemaInterface.js";
import problemaService from "../../../problemas/estadisticasProblemaBaseService.js";

const resultadosCalculador: CalculadorProblema = {

    estadoVacio: () => ({
        resultados: new Map(),
    }),

    cargarInicial: async (estado, problema) => {
        const resultados = await problemaService.getResultados(problema);
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
