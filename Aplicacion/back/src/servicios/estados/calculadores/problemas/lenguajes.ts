import { CalculadorProblema } from "../calculadorProblemaInterface.js";
import problemaService from "../../../problemas/estadisticasProblemaBaseService.js";

const lenguajesCalculador: CalculadorProblema = {

    estadoVacio: () => ({
        lenguajes: new Map(),
    }),

    cargarInicial: async (estado, problema) => {
        const lenguajes = await problemaService.getLenguajes(problema);
        estado.lenguajes = new Map(lenguajes.map(l => [l.name, l.value]));
    },

    actualizar: (estado, envio) => {
        estado.lenguajes.set(envio.lenguaje, (estado.lenguajes.get(envio.lenguaje) ?? 0) + 1);
    },

    clonar: (estado) => ({
        lenguajes: new Map(estado.lenguajes),
    }),
};

export default lenguajesCalculador;
