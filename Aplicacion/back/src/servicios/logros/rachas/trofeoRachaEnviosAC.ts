import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../types/enums/categoriaLogro.js";
import { EstadoUsuario } from "../../../types/estados/estadoUsuario.js";
import { CampoUsuario } from "../../../types/estados/camposEstadoUsuario.js";

/**
 * Trofeo parametrizado que se otorga al alcanzar una racha de envios AC consecutivos.
 * Cada instancia representa un logro concreto con su propio umbral y nivel.
 */
export class TrofeoRachaEnviosAC implements Logro {

    public readonly categoria = CategoriaLogro.RACHAS;
    public readonly sorpresa = false;

    public readonly version = 1;
    public readonly requiereEstadisticasUsuario = [CampoUsuario.RACHAS];
    public readonly requiereEstadisticasProblemas = [];

    public readonly id: number;
    public readonly nombre: string;
    public readonly descripcion: string;
    public readonly nivel: NivelLogro;
    private readonly umbral: number;
    public readonly imagen: string;

    constructor(id: number, nombre: string, umbral: number, nivel: NivelLogro, imagen: string) {
        this.id = id;
        this.nombre = nombre;
        this.umbral = umbral;
        this.nivel = nivel;
        this.descripcion = `He alcanzado una racha de ${umbral} envíos aceptados a la primera`;
        this.imagen = imagen;
    }

    public condicion(estadoUsuario: EstadoUsuario): boolean {
        return (estadoUsuario.rachaEnviosAC ?? 0) >= this.umbral;
    }
}
