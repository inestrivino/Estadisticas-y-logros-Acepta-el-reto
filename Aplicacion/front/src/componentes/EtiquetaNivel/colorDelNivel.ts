import { NivelUsuario } from "shared/NivelUsuarios.ts";

/**
 * Devuelve el color asociado a un nivel de usuario.
 * Fuente unica de verdad para los colores de nivel (usado por EtiquetaNivel y por los filtros del ranking).
 * @param n - Nombre del nivel.
 * @returns Color hexadecimal del nivel.
 */
export const colorDelNivel = (n: string): string => {
    switch (n) {
        case NivelUsuario.APRENDIZ:     return "#266e9b";
        case NivelUsuario.COMPETENTE:   return "#3989a8";
        case NivelUsuario.HABIL:        return "#4ca3b6";
        case NivelUsuario.ESPECIALISTA: return "#86c6e0";
        case NivelUsuario.PROFESIONAL:      return "#a4d3fc";
        default:                        return "#7a8a99";
    }
};

/**
 * Devuelve el color de texto del nivel. Mismo tono azul que el fondo pero
 * progresivamente mas oscuro a medida que el fondo se aclara, para que cada
 * nivel tenga su tipografia armonizada con el chip.
 * @param n - Nombre del nivel.
 * @returns Color hexadecimal del texto.
 */
export const colorTextoDelNivel = (n: string): string => {
    switch (n) {
        case NivelUsuario.APRENDIZ:     return "#fefefe";
        case NivelUsuario.COMPETENTE:   return "#f9f9f9";
        case NivelUsuario.HABIL:        return "#ffffff";
        case NivelUsuario.ESPECIALISTA: return "#1a4e78";
        case NivelUsuario.PROFESIONAL:      return "#0d3358";
        default:                        return "#fff";
    }
};
