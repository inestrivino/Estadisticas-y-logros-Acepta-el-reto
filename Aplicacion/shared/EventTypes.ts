export const EventType = {
  //ESTADISTICAS PROBLEMA
  ENVIOS_PROBLEMA: "reload-enviosTotalesProblema",
  MEJOR_TIEMPO_PROBLEMA: "reload-mejorTiempoProblema",
  TIEMPO_PROM_PROBLEMA: "reload-tiempoPromedioProblema",
  PROBLEMA_RESULTADOS: "reload-resultadosProblema",
  PROBLEMA_LENGUAJES: "reload-lenguajesProblema",

  //ESTADISTICAS USUARIO
  USUARIO_RESULTADOS: "reload-resultadosUsuario",
  USUARIO_LENGUAJES: "reload-lenguajesUsuario",
  USUARIO_PARTICIPACION: "reload-participacionUsuario",
  USUARIO_EXPERIENCIA_MES: "reload-experienciaMesUsuario",
  USUARIO_POS_RANKING: "reload-posRanking",
  USUARIO_NUM_PROBLEMAS_RESUELTOS: "reload-numProblemasResueltos",
  USUARIO_RACHA_ACTUAL_ENVIOS_AC: "reload-rachaActualEnviosAC",
  USUARIO_RACHA_MAX_ENVIOS_AC: "reload-rachaMaxEnviosAC",
  USUARIO_RACHA_ACTUAL_DIAS: "reload-rachaActualDias",
  USUARIO_RACHA_MAX_DIAS: "reload-rachaMaxDias",

  //LOGROS USUARIO
  LOGROS_USUARIO_NIVEL: "reload-logrosUsuarioNivel",
  LOGROS_USUARIO_CATEGORIA: "reload-logrosUsuarioCategoria",
  LOGROS_RECIENTES_USUARIO: "reload-logrosRecientesUsuario",

  //RANKING USUARIOS
  ACTUALIZACION_RANKING: "reload-rankingUsuarios",

  //NIVEL EXPERIENCIA USUARIO
  USUARIO_NIVEL: "reload-nivelUsuario",

  //PARA AVISAR DE QUE SE HAN CARGADO MAS ENVIOS DE LA CARGA INICIAL
  CARGA_ENVIOS: "reload-cargaEnvios"
} as const;

//Aux para formatear el evento con un string adicional (ejemplo: id del problema o usuario)
export function formatEvent(aux: string, eventType: EventTypes): string {
    return `${aux}-${eventType}`;
}

export type EventTypes = typeof EventType[keyof typeof EventType];