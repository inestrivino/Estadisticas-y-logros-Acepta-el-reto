import { CalculadorProblema } from "../calculadorProblemaInterface.js";
import problemaService from "../../../problemas/estadisticasProblemaBaseService.js";

const tiemposCalculador: CalculadorProblema = {

    estadoVacio: () => ({
        mejorTiempo: Infinity,
        tiempoTotal: 0,
        tiemposOrdenados: [],
        posUltimoEnvio: -1,
        tiemposEnvios: new Map(),
    }),

    cargarInicial: async (estado, problema) => {
        estado.mejorTiempo = await problemaService.getMejorTiempo(problema);
        estado.tiempoTotal = await problemaService.getTiempoTotal(problema);
        estado.tiemposOrdenados = await problemaService.getTiemposOrdenados(problema);
    },

    actualizar: (estado, envio) => {
        if (envio.resultado !== "AC")
            return;

        estado.tiempoTotal += envio.tiempo;

        if (envio.tiempo <= (estado.mejorTiempo ?? Infinity))
            estado.mejorTiempo = envio.tiempo;

        //se inserta el tiempo en el array ordenado para el ranking
        const pos = estado.tiemposOrdenados.findIndex(t => t > envio.tiempo);
        if (pos === -1)
            estado.tiemposOrdenados.push(envio.tiempo);
        else
            estado.tiemposOrdenados.splice(pos, 0, envio.tiempo);

        estado.tiemposEnvios.set(envio.envioId, envio.tiempo);
        estado.posUltimoEnvio = pos;
    },

    clonar: (estado) => ({
        tiemposOrdenados: [...estado.tiemposOrdenados],
        //tiemposEnvios no se clona porque se rellena al procesar el bloque
    }),
};

export default tiemposCalculador;
