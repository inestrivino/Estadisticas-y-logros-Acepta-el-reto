import { Logro } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";

const logro1: Logro = {
    id: 1,
    nombre: "logro1",
    descripcion: "Me he creado una cuenta",
    imagen: "trofeo_bronce_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.ONBOARDING,
    sorpresa: false,

    version: 1,
    requiereEstadisticas: [],

    enTiempoReal: false,

    condicion: (estadoUsuario, estadoProblema, envio) => true
};

export default logro1;
