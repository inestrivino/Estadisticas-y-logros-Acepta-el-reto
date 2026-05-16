import { NivelUsuario } from "shared/NivelUsuarios.ts";

//estructura de cada fila del ranking
export type datoUsuario = {
    nombre: string,
    nivel: string,
    xp: number,
    pos: number
};

//numero de usuarios por pagina del ranking
export const pagSize = 10;

//opciones del filtro por nivel; value vacio representa "todos los niveles"
export const NIVELES_FILTRO: { label: string, value: string }[] = [
    { label: "Todos", value: "" },
    { label: NivelUsuario.APRENDIZ, value: NivelUsuario.APRENDIZ },
    { label: NivelUsuario.COMPETENTE, value: NivelUsuario.COMPETENTE },
    { label: NivelUsuario.HABIL, value: NivelUsuario.HABIL },
    { label: NivelUsuario.ESPECIALISTA, value: NivelUsuario.ESPECIALISTA },
    { label: NivelUsuario.MAESTRO, value: NivelUsuario.MAESTRO },
];

/**
 * Devuelve el color asociado a un nivel de usuario.
 * @param n - Nombre del nivel.
 * @returns Color hexadecimal del nivel.
 */
export const colorDelNivel = (n: string): string => {
    switch (n) {
        case NivelUsuario.APRENDIZ: return "#3c6e71";
        case NivelUsuario.COMPETENTE: return "#80AEAB";
        case NivelUsuario.ESPECIALISTA: return "#7A99C7";
        case NivelUsuario.HABIL: return "#0078A7";
        case NivelUsuario.MAESTRO: return "#848F95";
        default: return "#7a8a99";
    }
};
