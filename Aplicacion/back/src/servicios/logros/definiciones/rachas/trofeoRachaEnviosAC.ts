import { Logro } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { CategoriaLogro } from "../../../../types/enums/categoriaLogro.js";
import { EstadoUsuario } from "../../../../types/estados/estadoUsuario.js";

/**
 * Trofeo parametrizado que se otorga al alcanzar una racha de envios AC consecutivos.
 * Cada instancia representa un logro concreto con su propio umbral y nivel.
 */
export class TrofeoRachaEnviosAC implements Logro {

    public readonly id = 1;
    public readonly imagen = "logro_placeholder.png";
    public readonly categoria = CategoriaLogro.RACHAS;
    public readonly sorpresa = false;
    public readonly enTiempoReal = true;

    public readonly nombre: string;
    public readonly descripcion: string;
    public readonly nivel: NivelLogro;
    private readonly umbral: number;

    constructor(nombre: string, umbral: number, nivel: NivelLogro) {
        this.nombre = nombre;
        this.umbral = umbral;
        this.nivel = nivel;
        this.descripcion = `Consecución de una racha de ${umbral} envíos aceptados a la primera`;
    }

    public condicion(estadoUsuario: EstadoUsuario): boolean {
        return (estadoUsuario.rachaEnviosAC ?? 0) >= this.umbral;
    }
}
