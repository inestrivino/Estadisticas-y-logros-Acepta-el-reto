import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import usuarioService from "../../../usuarios/estadisticasUsuarioBaseService.js";

const problemasCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        problemasAC: new Set(),
        problemasNoAC: new Set(),
        lenguajesProblemasResueltos: new Map(),
    }),

    cargarInicial: async (estado, usuario) => {
        estado.problemasAC = new Set(await usuarioService.getProblemasResueltos(usuario));
        //problemasNoAC y lenguajesProblemasResueltos no se persisten, se reconstruyen al procesar envios
    },

    actualizar: (estado, envio) => {
        if (envio.resultado === "AC") {
            estado.problemasAC.add(envio.problema);

            if (!estado.lenguajesProblemasResueltos.has(envio.lenguaje))
                estado.lenguajesProblemasResueltos.set(envio.lenguaje, new Set());
            estado.lenguajesProblemasResueltos.get(envio.lenguaje)!.add(envio.problema);
        }
        else {
            estado.problemasNoAC.add(envio.problema);
        }
    },

    clonar: (estado) => ({
        problemasAC: new Set(estado.problemasAC),
        problemasNoAC: new Set(estado.problemasNoAC),
        lenguajesProblemasResueltos: new Map([...estado.lenguajesProblemasResueltos].map(([l, s]) => [l, new Set(s)])),
    }),
};

export default problemasCalculador;
