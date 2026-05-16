import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { CampoProblema } from "../../../types/estados/camposEstadoProblema.js";

const logro17: Logro = {
    id: 1,
    nombre: "logro17",
    descripcion: "Envío correcto que iguale o mejore el tiempo de ejecución récord para un problema que tenga al menos 100 envios",
    imagen: "trofeo_oro_placeholder.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: true,

    version: 1,
    requiereEstadisticasUsuario: [],
    requiereEstadisticasProblemas: [CampoProblema.ENVIOS, CampoProblema.TIEMPOS],


    //tras actualizarEstado el mejorTiempo del problema ya refleja este envio, asi que si lo igualo o mejoro se cumple
    condicion: (estadoUsuario, estadoProblema, envio) => {
        const esAcierto = envio!.resultado === "AC";
        const esMejorTiempo = envio!.tiempo <= (estadoProblema!.mejorTiempo ?? Infinity);
        const cienEnvios = estadoProblema!.envios! >= 100;
        return esAcierto && esMejorTiempo && cienEnvios;
    }
};

export default logro17;
