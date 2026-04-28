export type EstadoUsuario = {
    numEnvios: number,                                          // total de envios
    problemasAC: Set<string>,                                   // problemas distintos con envio AC
    problemasNoAC: Set<string>,                                 // problemas en los que hay al menos un envio incorrecto

    resultados: Map<string, number>,                            // conteo de envios por resultado (AC, WA, TLE...)
    lenguajes: Set<string>,                                     // lenguajes que se han usado en los envios
    lenguajesConteo: Map<string, number>,                       // conteo de envios por lenguaje
    lenguajesAC: Map<string, number>,                           // conteo de envios AC por lenguaje
    lenguajesProblemasResueltos: Map<string, Set<string>>,      // problemas distintos resueltos por cada lenguaje

    diasValor: Map<number, number>,                             // conteo de envios por dia (timestamp -> cantidad)

    rachaEnviosAC: number,                                      // racha actual de envios consecutivos con resultado AC
    rachaEnviosACMax: number,                                   // racha maxima de envios consecutivos con resultado AC
    rachaDiasEnvio: number,                                     // racha actual de dias consecutivos en los que se ha realizado minimo 1 envio
    rachaDiasEnvioMax: number,                                  // racha maxima de dias consecutivos con envios

    ultimoDiaEnvio: number,                                     // timestamp del ultimo envio del usuario
    horas: Set<number>,                                         // las horas del dia en las que se ha realizado minimo un envio

    logros: Set<string>                                         // logros conseguidos por el usuario
}
