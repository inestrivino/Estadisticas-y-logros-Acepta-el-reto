import { Logro } from "../logro.js";
import { NivelLogro } from "../../../types/enums/nivelLogro.js";
import { TrofeoProblema } from "./trofeoProblema.js";

/**
 * los trofeos con condicion parametrizada se crean como instancias de la clase TrofeoProblema, 
 * que implementa la interfaz Logro, y se les pasa el numero de problemas concreto al constructor para generar 
 * el nombre y la descripción adecuados
 */
export const logrosProblemas: Logro[] = [
    new TrofeoProblema("logro4", 10, NivelLogro.BRONCE, "trofeo_bronce_placeholder.png"),
    new TrofeoProblema("logro5", 50, NivelLogro.PLATA, "trofeo_plata_placeholder.png"),
    new TrofeoProblema("logro6", 100, NivelLogro.PLATA, "trofeo_plata_placeholder.png"),
    new TrofeoProblema("logro7", 500, NivelLogro.ORO, "trofeo_oro_placeholder.png"),
];