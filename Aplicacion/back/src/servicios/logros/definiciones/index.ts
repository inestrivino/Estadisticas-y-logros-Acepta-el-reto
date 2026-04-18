import { Logro } from "../../../types/logro.js";
import { logrosOnboarding } from "./onboarding.js";
import { logrosProblemas } from "./problemas.js";
import { logrosLenguajes } from "./lenguajes.js";
import { logrosRachas } from "./rachas.js";
import { logrosCalidad } from "./calidad.js";

export const logros: Logro[] = [
    ...logrosOnboarding,
    ...logrosProblemas,
    ...logrosLenguajes,
    ...logrosRachas,
    ...logrosCalidad,
];

export default logros;
