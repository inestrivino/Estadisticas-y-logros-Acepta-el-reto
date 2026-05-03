import { CalculadorUsuario } from "../calculadorUsuarioInterface.js";
import usuarioService from "../../../usuarios/estadisticasUsuarioBaseService.js";

const rachasCalculador: CalculadorUsuario = {

    estadoVacio: () => ({
        rachaEnviosAC: 0,
        rachaEnviosACMax: 0,
        rachaDiasEnvio: 0,
        rachaDiasEnvioMax: 0,
        ultimoDiaEnvio: 0,
    }),

    cargarInicial: async (estado, usuario) => {
        estado.rachaEnviosAC = await usuarioService.getRachaEnviosCorrectos(usuario);
        estado.rachaEnviosACMax = estado.rachaEnviosAC;
        estado.rachaDiasEnvio = await usuarioService.getRachaDiasEnviosConsecutivos(usuario);
        estado.rachaDiasEnvioMax = estado.rachaDiasEnvio;
        estado.ultimoDiaEnvio = await usuarioService.getUltimoEnvioUsuario(usuario);
    },

    actualizar: (estado, envio) => {

        //RACHA DE DIAS
        //si el ultimo envio fue exactamente el dia anterior, se incrementa la racha de dias consecutivos
        //si fue hace mas de un dia, la racha se reinicia a 0
        if (estado.ultimoDiaEnvio < (envio.fecha - 24 * 60 * 60))
            estado.rachaDiasEnvio = 0;
        else if (estado.ultimoDiaEnvio === envio.fecha - 24 * 60 * 60)
            estado.rachaDiasEnvio++;

        if (estado.rachaDiasEnvio > estado.rachaDiasEnvioMax)
            estado.rachaDiasEnvioMax = estado.rachaDiasEnvio;

        estado.ultimoDiaEnvio = envio.fecha;

        //RACHA DE ENVIOS AC
        //un envio AC incrementa la racha actual; uno incorrecto la rompe a 0
        if (envio.resultado === "AC") {
            estado.rachaEnviosAC++;
            if (estado.rachaEnviosAC > estado.rachaEnviosACMax)
                estado.rachaEnviosACMax = estado.rachaEnviosAC;
        }
        else {
            estado.rachaEnviosAC = 0;
        }
    },
};

export default rachasCalculador;
