import { Logro  } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";
import { EstadoUsuario } from "../../../../types/estados/estadoUsuario.js";

/**
 * Trofeo parametrizado que se otorga al resolver 25 problemas distintos en un lenguaje concreto.
 * Cada instancia representa un logro asociado a un lenguaje.
 */
export class TrofeoLenguaje implements Logro {

    public readonly id = 1;
    public readonly imagen = "logro_placeholder.png";
    public readonly categoria = CategoriaLogro.LENGUAJES;
    public readonly nivel = NivelLogro.ORO;
    public readonly sorpresa = false;
    public readonly enTiempoReal = false;

    public readonly nombre: string;
    public readonly descripcion: string;
    private readonly lenguaje: string;

    constructor(nombre: string, lenguaje: string, lenguajeDisplay: string) {
        this.nombre = nombre;
        this.lenguaje = lenguaje;
        this.descripcion = `Resolución de 25 problemas en ${lenguajeDisplay}`;
    }

    public condicion(estadoUsuario: EstadoUsuario): boolean {
        return (estadoUsuario.lenguajesProblemasResueltos.get(this.lenguaje)?.size ?? 0) >= 25;
    }
}
