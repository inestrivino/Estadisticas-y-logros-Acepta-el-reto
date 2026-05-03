import { Logro } from "../logro.js";
import { NivelLogro } from "../../../../types/enums/nivelLogro.js";
import { TrofeoRachaEnviosAC } from "./trofeoRachaEnviosAC.js";
import { TrofeoRachaDias } from "./trofeoRachaDias.js";
import logro18 from "./logro18.js";

/**
 * los trofeos con condicion parametrizada se crean como instancias de las clases TrofeoRachaEnviosAC
 * y TrofeoRachaDias, que implementan la interfaz Logro, y se les pasa el umbral concreto al constructor
 * para generar el nombre y la descripción adecuados
 */
export const logrosRachas: Logro[] = [
    new TrofeoRachaEnviosAC("logro12", 5, NivelLogro.ORO),
    new TrofeoRachaDias("logro13", 7, NivelLogro.BRONCE),
    logro18,
];
