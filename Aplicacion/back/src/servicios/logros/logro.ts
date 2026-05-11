import { EnvioProcesado } from "../../types/envios/envioProcesado.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { EstadoProblema } from "../../types/estados/estadoProblema.js";
import { CategoriaLogro } from "../../types/enums/categoriaLogro.js";
import { NivelLogro } from "../../types/enums/nivelLogro.js";

export interface Logro {
  //datos del logro
  id: number;
  nombre: string;
  descripcion: string;
  imagen: string;
  categoria: CategoriaLogro;
  nivel: NivelLogro;
  sorpresa: boolean;

  //version actual del logro, se compara con la version aplicada para decidir si recalcular
  version: number;

  //ids de los calculadores cuyas estadisticas necesita este logro para evaluar su condicion
  //si todas estan al dia y el logro no es en tiempo real basta con reevaluar usuarios sin reprocesar envios
  requiereEstadisticas: string[];

  //si el logro es dependiente del estado actual o no
  //por ejemplo una racha depende del valor de la racha actual mas el nuevo envio
  //el numero de correctos es independiente y puede ser evaluado tras cargar los envios
  enTiempoReal: boolean;

  //condicion para conseguir el logro en base al estado del usuario que hizo el envio y el estado del problema
  condicion(estadoUsuario: EstadoUsuario, estadoProblema?: EstadoProblema, envio?: EnvioProcesado): boolean;
}
