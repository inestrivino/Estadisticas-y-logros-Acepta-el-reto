import { CampoUsuarioKey } from "../../types/estados/camposEstadoUsuario.js";
import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";

export abstract class ActualizadorXP {
    prueba?():number;

    abstract id: CampoUsuarioKey;

    abstract version: number;

    abstract actualizar(estadoIni: EstadoUsuario, estadoFin: EstadoUsuario): number;
}