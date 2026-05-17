import { CampoUsuario } from './camposEstadoUsuario.js';

export type EstadoUsuario = {

    //para poder acceder a los datos del tipo como un array
    [key: string]: any;

    [CampoUsuario.NUM_ENVIOS]?: true,                           // centinela de numero de envios
    numEnvios?: number,                                         // total de envios

    [CampoUsuario.PROBLEMAS]?: true,                            // centinela de problemas resueltos
    problemasAC?: Set<string>,                                  // problemas distintos con envio AC
    problemasNoAC?: Set<string>,                                // problemas en los que hay al menos un envio incorrecto

    [CampoUsuario.RESULTADOS]?: true,                           // centinela de resultados por tipo
    resultados?: Map<string, number>,                           // conteo de envios por resultado (AC, WA, TLE...)

    [CampoUsuario.LENGUAJES]?: true,                            // centinela de lenguajes usados
    lenguajes?: Set<string>,                                    // lenguajes que se han usado en los envios
    lenguajesConteo?: Map<string, number>,                      // conteo de envios por lenguaje
    lenguajesAC?: Map<string, number>,                          // conteo de envios AC por lenguaje
    lenguajesProblemasResueltos?: Map<string, Set<string>>,     // problemas distintos resueltos por cada lenguaje

    [CampoUsuario.DIAS_VALOR]?: true,                           // centinela de envios por dia
    diasValor?: Map<number, number>,                            // conteo de envios por dia (timestamp -> cantidad)

    [CampoUsuario.RACHAS]?: true,                               // centinela de rachas de envios y dias consecutivos
    rachaEnviosAC?: number,                                     // racha actual de envios consecutivos con resultado AC
    rachaEnviosACMax?: number,                                  // racha maxima de envios consecutivos con resultado AC
    rachaDiasEnvio?: number,                                    // racha actual de dias consecutivos en los que se ha realizado minimo 1 envio
    rachaDiasEnvioMax?: number,                                 // racha maxima de dias consecutivos con envios
    ultimoDiaEnvio?: number,                                    // timestamp del ultimo envio del usuario

    [CampoUsuario.HORAS]?: true,                                // centinela de horas de actividad
    horas?: Set<number>,                                        // las horas del dia en las que se ha realizado minimo un envio
}