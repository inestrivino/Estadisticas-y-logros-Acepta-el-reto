import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";

const logro2: Logro = {
    id: 1,
    nombre: "logro2",
    descripcion: "Realización del primer envío",
    imagen: "trofeo_bronce_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,

    version: 1,
    requiereEstadisticasUsuario: [CampoUsuario.NUM_ENVIOS],
    requiereEstadisticasProblemas: [],


    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.numEnvios! >= 1
};

export default logro2;
