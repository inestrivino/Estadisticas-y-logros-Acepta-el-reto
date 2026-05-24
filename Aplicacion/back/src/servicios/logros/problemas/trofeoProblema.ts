import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";

/**
 * Trofeo parametrizado que se otorga al alcanzar una cantidad determinada de problemas resueltos.
 * Cada instancia representa un logro concreto con su propio umbral y nivel.
 */
export class TrofeoProblema implements Logro {

    public readonly categoria = CategoriaLogro.PROBLEMAS;
    public readonly sorpresa = false;

    public readonly version = 1;
    public readonly requiereEstadisticasUsuario = [CampoUsuario.PROBLEMAS];
    public readonly requiereEstadisticasProblemas = [];

    public readonly id: number;
    public readonly nombre: string;
    public readonly descripcion: string;
    public readonly nivel: NivelLogro;
    private readonly cantidad: number;
    public readonly imagen: string;

    constructor(id: number, nombre: string, cantidad: number, nivel: NivelLogro, imagen: string) {
        this.id = id;
        this.nombre = nombre;
        this.cantidad = cantidad;
        this.nivel = nivel;
        this.descripcion = `He resuelto ${cantidad} problemas`;
        this.imagen = imagen;
    }

    public condicion(estadoUsuario: EstadoUsuario): boolean {
        return estadoUsuario.problemasAC!.size >= this.cantidad;
    }
}
