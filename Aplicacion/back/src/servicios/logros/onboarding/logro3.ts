import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";

const logro3: Logro = {
    id: 3,
    nombre: "Cazarrecompensas",
    descripcion: "He obtenido 5 logros",
    imagen: "logro3.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,

    version: 1,
    requiereEstadisticasUsuario: [],
    requiereEstadisticasProblemas: [],


    condicion: (estadoUsuario, estadoProblema, envio, logrosACtuales) => logrosACtuales!.size >= 5
};

export default logro3;
