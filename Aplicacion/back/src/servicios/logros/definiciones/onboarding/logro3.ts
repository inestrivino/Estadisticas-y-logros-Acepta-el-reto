import { Logro } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";

const logro3: Logro = {
    id: 1,
    nombre: "logro3",
    descripcion: "Obtención de 5 logros",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,

    version: 1,
    requiereEstadisticas: ["logrosUsuario"],

    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.logros.size >= 5
};

export default logro3;
