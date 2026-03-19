import { NivelLogro, CategoriaLogro } from "./LogroConsts.ts";

export type DatosLogro = {
  nombre: string;
  descripcion: string;
  imagen: string;
  nivel: NivelLogro;
  categoria: CategoriaLogro;
  obtenido: boolean;
  sorpresa: boolean;
};

export type GrupoLogros = {
  grupo: string;
  logros: DatosLogro[];
};

export type ListadoLogros = {
  clasificacion: string;
  grupos: GrupoLogros[];
};
