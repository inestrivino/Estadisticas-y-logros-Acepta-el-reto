export const EventType = {
  DIAGRAMA_PROBLEMAS: "reload-resultadosProblemas",
  ENVIOS_PROBLEMA: "reload-enviosTotalesProblema",
  TIEMPO_MEDIO_PROBLEMA: "reload-tiempoMedioProblema",
  TIEMPO_MIN_PROBLEMA: "reload-tiempoMinProblema"
} as const;

export type EventTypes = typeof EventType[keyof typeof EventType];