import { Logro } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";

const logro18: Logro = {
    id: 1,
    nombre: "logro18",
    descripcion: "He realizado envíos en cada hora del día",
    imagen: "trofeo_plata_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.RACHAS,
    sorpresa: true,

    version: 1,
    requiereEstadisticas: ["horasUsuario"],

    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario?.horas?.size === 24
};

export default logro18;
