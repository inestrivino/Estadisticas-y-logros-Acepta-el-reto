import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import usuarioService from "../../../usuarios/estadisticasUsuarioBaseService.js";

const diasValorCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        diasValor: new Map(),
    }),

    cargarInicial: async (estado, usuario) => {
        const diasValor = await usuarioService.getDiasValor(usuario);
        estado.diasValor = new Map(diasValor.map(d => [d.timestamp, d.value]));
    },

    actualizar: (estado, envio) => {
        //TODO filtrar envios anteriores al ultimo año
        estado.diasValor.set(envio.fecha, (estado.diasValor.get(envio.fecha) ?? 0) + 1);
    },

    clonar: (estado) => ({
        diasValor: new Map(estado.diasValor),
    }),
};

export default diasValorCalculador;
