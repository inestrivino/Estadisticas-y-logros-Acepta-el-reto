import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";

const logro1: Logro = {
    id: 1,
    nombre: "Primeros pasos",
    descripcion: "Me he creado una cuenta",
    imagen: "logro1.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,

    version: 1,
    requiereEstadisticasUsuario: [],
    requiereEstadisticasProblemas: [],


    condicion: (estadoUsuario, estadoProblema, envio) => true
};

export default logro1;
