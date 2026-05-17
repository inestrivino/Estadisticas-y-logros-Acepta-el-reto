import { NivelLogro, CategoriaLogro } from "./LogroConsts.js";

export type DatosLogro = {
  nombre: string;
  descripcion: string;
  descripcionBorrosa?: string;
  imagen: string;
  nivel: NivelLogro;
  categoria: CategoriaLogro;
  obtenido: boolean;
  sorpresa: boolean;
};

export type TGrupoLogros = {
  grupo: string;
  logros: DatosLogro[];
};

export type ListadoLogros = {
  clasificacion: string;
  grupos: TGrupoLogros[];
};
