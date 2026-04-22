import { Logro, NivelLogro, CategoriaLogro } from "../../../types/logro.js";

function logroProblemasLenguaje(nombre: string, lenguaje: string, lenguajeDisplay: string): Logro {
    return {
        id: 1,
        nombre,
        descripcion: `Resolución de 25 problemas en ${lenguajeDisplay}`,
        imagen: "logro_placeholder.png",
        nivel: NivelLogro.ORO,
        categoria: CategoriaLogro.LENGUAJES,
        sorpresa: false,
       
        enTiempoReal: false,

        condicion: (estadoUsuario, estadoProblema, envio) => (estadoUsuario.lenguajesProblemasResueltos.get(lenguaje)?.size ?? 0) >= 25
    };
}

export const logrosLenguajes: Logro[] = [
    logroProblemasLenguaje("logro8", "c", "C"),
    logroProblemasLenguaje("logro9", "cpp", "C++"),
    logroProblemasLenguaje("logro10", "java", "Java"),
    {
        id: 1,
        nombre: "logro11",
        descripcion: "Haber realizado envíos con 3 lenguajes diferentes",
        imagen: "logro_placeholder.png",
        nivel: NivelLogro.PLATA,
        categoria: CategoriaLogro.LENGUAJES,
        sorpresa: false,
        
        enTiempoReal: false,

        condicion: (estadoUsuario, estadoProblema, envio) => estadoUsuario.lenguajes.size >= 3
    }
];
