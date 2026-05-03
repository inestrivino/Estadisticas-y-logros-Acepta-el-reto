import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import usuarioService from "../../../usuarios/estadisticasUsuarioBaseService.js";

const lenguajesCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        lenguajes: new Set(),
        lenguajesConteo: new Map(),
        lenguajesAC: new Map(),
    }),

    cargarInicial: async (estado, usuario) => {
        const lenguajes = await usuarioService.getLenguajes(usuario);
        estado.lenguajes = new Set(lenguajes.map(l => l.name));
        estado.lenguajesConteo = new Map(lenguajes.map(l => [l.name, l.value]));

        const lenguajesAC = await usuarioService.getLenguajesAC(usuario);
        estado.lenguajesAC = new Map(lenguajesAC.map(l => [l.name, l.value]));
    },

    actualizar: (estado, envio) => {
        estado.lenguajes.add(envio.lenguaje);
        estado.lenguajesConteo.set(envio.lenguaje, (estado.lenguajesConteo.get(envio.lenguaje) ?? 0) + 1);

        if (envio.resultado === "AC")
            estado.lenguajesAC.set(envio.lenguaje, (estado.lenguajesAC.get(envio.lenguaje) ?? 0) + 1);
    },

    clonar: (estado) => ({
        lenguajes: new Set(estado.lenguajes),
        lenguajesConteo: new Map(estado.lenguajesConteo),
        lenguajesAC: new Map(estado.lenguajesAC),
    }),
};

export default lenguajesCalculador;
