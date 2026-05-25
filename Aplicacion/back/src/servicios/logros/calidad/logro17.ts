import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { CampoProblema } from "../../../types/estados/camposEstadoProblema.js";

const logro17: Logro = {
    id: 16,
    nombre: "Speedrunner",
    descripcion: "He realizado un envío correcto que iguale o mejore el tiempo de ejecución récord para un problema que tiene al menos 100 envios",
    imagen: "logro16.png",
    nivel: NivelLogro.ORO,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: true,
    descripcionBorrosa: "¡Cuarenta y dos! chilló Loonquawl. ¿Eso es todo lo que tienes que decirnos después de siete millores y medio de años detrabajo?",

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
