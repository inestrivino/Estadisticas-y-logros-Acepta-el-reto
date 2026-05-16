import { EnvioProcesado } from "../../types/envios/envioProcesado.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import { EstadoProblema } from "../../types/estados/estadoProblema.js";
import { CategoriaLogro } from "../../types/enums/categoriaLogro.js";
import { NivelLogro } from "../../types/enums/nivelLogro.js";
import { CampoProblemaKey } from "../../types/estados/camposEstadoProblema.js";
import { CampoUsuarioKey } from "../../types/estados/camposEstadoUsuario.js";

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

  //ids de los actualizadores cuyas estadisticas necesita este logro para evaluar su condicion
  requiereEstadisticasUsuario: CampoUsuarioKey[];
  requiereEstadisticasProblemas: CampoProblemaKey[];

  //condicion para conseguir el logro en base al estado del usuario que hizo el envio y el estado del problema
  condicion(estadoUsuario: EstadoUsuario, estadoProblema?: EstadoProblema, envio?: EnvioProcesado, logrosActuales?: Set<Logro>): boolean;
}
