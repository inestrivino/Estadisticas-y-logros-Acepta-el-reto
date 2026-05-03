import { CalculadorProblema } from "../calculadorProblemaInterface.js";
import problemaService from "../../../problemas/estadisticasProblemaBaseService.js";

const enviosCalculador: CalculadorProblema = {

    estadoVacio: () => ({
        envios: 0,
        enviosAC: 0,
    }),

    cargarInicial: async (estado, problema) => {
        estado.envios = await problemaService.getNumEnvios(problema);
        estado.enviosAC = await problemaService.getNumEnviosAC(problema);
    },

    actualizar: (estado, envio) => {
        estado.envios++;
        if (envio.resultado === "AC")
            estado.enviosAC++;
    },
};

export default enviosCalculador;
