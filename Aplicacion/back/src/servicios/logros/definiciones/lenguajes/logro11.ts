import { Logro } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";

const logro11: Logro = {
    id: 1,
    nombre: "logro11",
    descripcion: "Haber realizado envíos con 3 lenguajes diferentes",
    imagen: "logro_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.LENGUAJES,
    sorpresa: false,

    version: 1,
    requiereEstadisticas: ["lenguajesUsuario"],

    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.lenguajes.size >= 3
};

export default logro11;
