import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";

const logro11: Logro = {
    id: 11,
    nombre: "logro11",
    descripcion: "He realizado envíos con 3 lenguajes diferentes",
    imagen: "trofeo_plata_placeholder.png",
    nivel: NivelLogro.PLATA,
    categoria: CategoriaLogro.LENGUAJES,
    sorpresa: false,

    version: 1,
    requiereEstadisticasUsuario: [CampoUsuario.LENGUAJES],
    requiereEstadisticasProblemas: [],


    condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.lenguajes!.size >= 3
};

export default logro11;
