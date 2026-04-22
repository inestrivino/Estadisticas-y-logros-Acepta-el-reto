export type EstadoUsuario = {
    numEnvios: number,                                          // total de envios
    problemasAC: Set<string>,                                   // problemas distintos con envio AC
    problemasNoAC: Set<string>,                                 // problemas en los que hay al menos un envio incorrecto
    
    lenguajesProblemasResueltos: Map<string, Set<string>>,      // problemas distintos resueltos por cada lenguaje
    lenguajes: Set<string>,                                     // lenguajes que se han usado en los envios
    
    rachaEnviosAC: number,                                      // racha actual de envios consecutivos con resultado AC
    rachaDiasEnvio: number,                                     // racha actual de dias consecutivos en los que se ha realizado minimo 1 envio
    
    ultimoDiaEnvio: number,                                    // fecha (dd-mm-aaaa) en la que se realizo el ultimo envio
    horas: Set<number>,                                         // las horas del dia en las que se ha realizado minimo un envio
    
    logros: Set<string>                                         // logros conseguidos por el usuario
}
