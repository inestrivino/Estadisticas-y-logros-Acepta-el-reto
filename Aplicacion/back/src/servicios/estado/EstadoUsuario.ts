export type EstadoUsuario = {
    numEnvios: number, // total de envios
    numProblemasResueltos: number, // envios con resultado AC
    lenguajesProblemasResueltos: Map<string, number>, // cantidad de problemas resueltos por cada lenguaje
    lenguajes: Set<string>, // lenguajes que se han usado en los envios
    logros: Set<string>, // logros conseguidos por el usuario
    rachaEnviosAC: number, // racha actual de envios consecutivos con resultado AC 
                            // TODO a lo mejor esto tendria que aparecer tambien los problemas, para que no se pueda conseguir enviando 5 veces la misma solucion
    rachaEnviosACMax?: number,
    rachaDiasEnvio: number, // racha actual de dias consecutivos en los que se ha realizado minimo 1 envio
    rachaDiasEnvioMax?: number,
    ultimoDiaEnvio?: string, // fecha (dd-mm-aaaa) en la que se realizo el ultimo envio
    categoriaProblemasResueltos: Set<string>, // categorias a las que pertenece minimo uno de los problemas resueltos por el usuario
    franjasHorarias: Set<number> // las horas del dia en las que se ha realizado minimo un envio
}