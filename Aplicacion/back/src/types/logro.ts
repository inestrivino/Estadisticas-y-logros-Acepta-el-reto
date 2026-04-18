import { EnvioProcesado } from "./envioProcesado.js";
import { EstadoUsuario } from "./estadoUsuario.js";
import { EstadoProblema } from "./estadoProblema.js";

export enum NivelLogro {
  BRONCE = "Bronce",
  PLATA = "Plata",
  ORO = "Oro"
}

export enum CategoriaLogro {
  ONBOARDING = "Onboarding",
  PROBLEMAS = "Número de problemas",
  LENGUAJES = "Uso de lenguajes",
  RACHAS = "Rachas",
  CALIDAD = "Calidad",
  CATEGORIAS = "Categorías"
}

export type Logro = {
  //datos del logro
  id: number,
  nombre: string,
  descripcion: string,
  imagen: string,
  categoria: CategoriaLogro,
  nivel: NivelLogro,
  sorpresa: boolean,

  //si el logro es dependiente del estado actual o no
  //por ejemplo una racha depende del valor de la racha actual mas el nuevo envio
  //el numero de correctos es independiente y puede ser evaluado tras cargar los envios
  enTiempoReal: boolean,
 
  //condicion para conseguir el logro en base al estado del usuario que hizo el envio y el estado del problema
  condicion: (estadoUsuario: EstadoUsuario, estadoProblema?: EstadoProblema, envio?: EnvioProcesado) => boolean
};
