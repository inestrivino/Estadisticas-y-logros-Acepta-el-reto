import { Logro, NivelLogro, CategoriaLogro } from "../../../types/logro.js";

function logroProblemasResueltos(nombre: string, cantidad: number, nivel: NivelLogro): Logro {
    return {
        id: 1,
        nombre,
        descripcion: `Resolución de ${cantidad} problemas`,
        imagen: "logro_placeholder.png",
        nivel,
        categoria: CategoriaLogro.PROBLEMAS,
        sorpresa: false,
        
        enTiempoReal: false,

        condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.problemasAC.size >= cantidad
    };
}

export const logrosProblemas: Logro[] = [
    logroProblemasResueltos("logro4", 10, NivelLogro.BRONCE),
    logroProblemasResueltos("logro5", 50, NivelLogro.PLATA),
    logroProblemasResueltos("logro6", 100, NivelLogro.PLATA),
    logroProblemasResueltos("logro7", 500, NivelLogro.ORO),
];
