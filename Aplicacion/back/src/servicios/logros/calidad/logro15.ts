import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { CampoProblema } from "../../../types/estados/camposEstadoProblema.js";

const logro15: Logro = {
    id: 1,
    nombre: "logro15",
    descripcion: "Envío correcto dentro del 25% de soluciones más rápidas para un problema que tenga al menos 100 envios",
    imagen: "trofeo_plata_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: false,

    version: 1,
    requiereEstadisticasUsuario: [],
    requiereEstadisticasProblemas: [CampoProblema.ENVIOS, CampoProblema.TIEMPOS],

    condicion: (estadoUsuario, estadoProblema, envio) => {
        const esAcierto = envio!.resultado === "AC";
        const esRapido = estadoProblema!.posUltimoEnvio! < Math.floor(0.25 * estadoProblema!.envios!);
        const cienEnvios = estadoProblema!.envios! >= 100;
        return esAcierto && esRapido && cienEnvios;
    }
};

export default logro15;
