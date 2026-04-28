export type EstadoProblema = {
    //se sacan de la base de datos:
    envios: number,                         // total de envios
    enviosAC: number,                       // total de envios con resultado AC
    mejorTiempo: number,                    // mejor tiempo de ejecucion registrado entre los envios AC
    tiempoTotal: number,                    // suma de tiempos de ejecucion de los envios AC (para el promedio)
    resultados: Map<string, number>,        // conteo de envios por resultado (AC, WA, TLE...)
    lenguajes: Map<string, number>,         // conteo de envios por lenguaje
    tiemposOrdenados: number[],             // tiempos de envios AC ordenados ascendentemente, para el ranking
    
    //calculados al procesar:
    posUltimoEnvio: number                  // posicion en el array del ultimo envio registrado para evitar volver a iterar por los envios
    tiemposEnvios: Map<number, number>      // mapa de idEnvio a tiempo de ejecucion para los envios AC
}
