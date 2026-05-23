import { CategoriaLogro } from "shared";

/**
 * Devuelve el color asociado a la categoria de logro.
 * @param n - Nombre de la categoria.
 * @returns Color hexadecimal de la categoria.
 */
export const colorCategoriaLogro = (n: string): string => {
    switch (n) {
        case CategoriaLogro.ONBOARDING: return "#3c6e71";
        case CategoriaLogro.PROBLEMAS: return "#80AEAB";
        case CategoriaLogro.LENGUAJES: return "#7A99C7";
        case CategoriaLogro.RACHAS: return "#0078A7";
        case CategoriaLogro.CALIDAD: return "#848F95";
        default: return "#7a8a99";
    }
};

