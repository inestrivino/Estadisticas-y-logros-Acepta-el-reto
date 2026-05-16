import { NivelUsuario } from "shared/NivelUsuarios.ts";

//reexportado desde EtiquetaNivel para que filtros y tabla compartan la misma fuente de colores
export { colorDelNivel, colorTextoDelNivel } from "../EtiquetaNivel/colorDelNivel.ts";

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
    { label: NivelUsuario.PROFESIONAL, value: NivelUsuario.PROFESIONAL },
];
