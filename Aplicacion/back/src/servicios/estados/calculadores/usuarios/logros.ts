import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import logrosService from "../../../logros/logrosService.js";

const logrosCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        logros: new Set(),
    }),

    cargarInicial: async (estado, usuario) => {
        estado.logros = new Set(await logrosService.getLogros(usuario));
    },

    //los logros nuevos los añade el propio servicio de logros al evaluar el envio
    actualizar: () => {},

    clonar: (estado) => ({
        logros: new Set(estado.logros),
    }),
};

export default logrosCalculador;
