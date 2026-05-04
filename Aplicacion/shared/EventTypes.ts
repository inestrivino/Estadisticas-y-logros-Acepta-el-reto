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

  //LOGROS USUARIO
  LOGROS_USUARIO_NIVEL: "reload-logrosUsuarioNivel",
  LOGROS_USUARIO_CATEGORIA: "reload-logrosUsuarioCategoria",

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