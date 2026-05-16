import { Logro  } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";

const logro14: Logro = {
    id: 1,
    nombre: "logro14",
    descripcion: "Resolución de un problema en el primer intento",
    imagen: "trofeo_bronce_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: false,

    version: 1,
    requiereEstadisticasUsuario: [CampoUsuario.PROBLEMAS],
    requiereEstadisticasProblemas: [],

    //se comprueba que el envio es AC y que el problema no tiene envios incorrectos previos
    condicion: (estadoUsuario, estadoProblema, envio) => envio!.resultado === "AC" && !estadoUsuario.problemasNoAC!.has(envio!.problema)
};

export default logro14;
