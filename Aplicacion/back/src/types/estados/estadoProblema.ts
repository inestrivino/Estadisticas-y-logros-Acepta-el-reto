import { CampoProblema } from './camposEstadoProblema.js';

export type EstadoProblema = {
    [key: string]: any;
    [CampoProblema.ENVIOS]?: true,                          // centinela de envios totales
    envios?: number,                                        // total de envios
    enviosAC?: number,                                      // total de envios con resultado AC
    [CampoProblema.TIEMPOS]?: true,                         // centinela de tiempos de ejecucion
    mejorTiempo?: number,                                   // mejor tiempo de ejecucion registrado entre los envios AC
    tiempoTotal?: number,                                   // suma de tiempos de ejecucion de los envios AC (para el promedio)
    tiemposOrdenados?: number[],                            // tiempos de envios AC ordenados ascendentemente, para el ranking
    posUltimoEnvio?: number,                                // posicion en el array del ultimo envio registrado para evitar volver a iterar
    tiemposEnvios?: Map<number, number>,                    // mapa de idEnvio a tiempo de ejecucion para los envios AC
    [CampoProblema.RESULTADOS]?: true,                      // centinela de resultados por tipo
    resultados?: Map<string, number>,                       // conteo de envios por resultado (AC, WA, TLE...)
    [CampoProblema.LENGUAJES]?: true,                       // centinela de lenguajes usados
    lenguajes?: Map<string, number>,                        // conteo de envios por lenguaje
}
