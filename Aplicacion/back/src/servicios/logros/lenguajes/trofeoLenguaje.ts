import { Logro  } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";

/**
 * Trofeo parametrizado que se otorga al resolver 25 problemas distintos en un lenguaje concreto.
 * Cada instancia representa un logro asociado a un lenguaje.
 */
export class TrofeoLenguaje implements Logro {

    public readonly id = 1;
    public readonly categoria = CategoriaLogro.LENGUAJES;
    public readonly nivel = NivelLogro.ORO;
    public readonly sorpresa = false;
    public readonly enTiempoReal = false;

    public readonly version = 1;
    public readonly requiereEstadisticas = ["problemasUsuario"];

    public readonly nombre: string;
    public readonly descripcion: string;
    private readonly lenguaje: string;
    public readonly imagen: string;

    constructor(nombre: string, lenguaje: string, lenguajeDisplay: string, imagen: string) {
        this.nombre = nombre;
        this.lenguaje = lenguaje;
        this.descripcion = `He resuelto 25 problemas en ${lenguajeDisplay}`;
        this.imagen = imagen;
    }

    public condicion(estadoUsuario: EstadoUsuario): boolean {
        return (estadoUsuario.lenguajesProblemasResueltos!.get(this.lenguaje)?.size ?? 0) >= 25;
    }
}
