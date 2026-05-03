import { Logro } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";
import { EstadoUsuario } from "../../../../types/estados/estadoUsuario.js";

/**
 * Trofeo parametrizado que se otorga al alcanzar una cantidad determinada de problemas resueltos.
 * Cada instancia representa un logro concreto con su propio umbral y nivel.
 */
export class TrofeoProblema implements Logro {

    public readonly id = 1;
    public readonly imagen = "logro_placeholder.png";
    public readonly categoria = CategoriaLogro.PROBLEMAS;
    public readonly sorpresa = false;
    public readonly enTiempoReal = false;

    public readonly nombre: string;
    public readonly descripcion: string;
    public readonly nivel: NivelLogro;
    private readonly cantidad: number;

    constructor(nombre: string, cantidad: number, nivel: NivelLogro) {
        this.nombre = nombre;
        this.cantidad = cantidad;
        this.nivel = nivel;
        this.descripcion = `Resolución de ${cantidad} problemas`;
    }

    public condicion(estadoUsuario: EstadoUsuario): boolean {
        return estadoUsuario.problemasAC.size >= this.cantidad;
    }
}
