import { Logro  } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";

const logro14: Logro = {
    id: 1,
    nombre: "logro14",
    descripcion: "He resuelto un problema en el primer intento",
    imagen: "trofeo_bronce_placeholder.png",
    nivel: NivelLogro.BRONCE,
    categoria: CategoriaLogro.CALIDAD,
    sorpresa: false,

    version: 1,
    requiereEstadisticas: ["problemasUsuario"],

    enTiempoReal: true,

    //se comprueba que el envio es AC y que el problema no tiene envios incorrectos previos
    condicion: (estadoUsuario, estadoProblema, envio) => envio!.resultado === "AC" && !estadoUsuario.problemasNoAC?.has(envio!.problema)
};

export default logro14;
