import { Logro } from "../logro.js";
import { TrofeoLenguaje } from "./trofeoLenguaje.js";
import logro11 from "./logro11.js";

/**
 * los trofeos con condicion parametrizada se crean como instancias de la clase TrofeoLenguaje, 
 * que implementa la interfaz Logro, y se les pasa el lenguaje concreto al constructor para generar 
 * el nombre y la descripción adecuados
 */
export const logrosLenguajes: Logro[] = [
    new TrofeoLenguaje("logro8", "c", "C", "trofeo_oro_placeholder.png"),
    new TrofeoLenguaje("logro9", "cpp", "C++", "trofeo_oro_placeholder.png"),
    new TrofeoLenguaje("logro10", "java", "Java", "trofeo_oro_placeholder.png"),
    logro11,
];
