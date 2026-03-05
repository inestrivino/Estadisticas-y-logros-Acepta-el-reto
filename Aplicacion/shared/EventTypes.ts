export const EventType = {
  DIAGRAMA_PROBLEMAS: "reload-resultadosProblemas",
  DIAGRAMA_LENGUAJES: "reload-resultadosLenguajes",
  ENVIOS_PROBLEMA: "reload-enviosTotalesProblema",
  TIEMPO_MEDIO_PROBLEMA: "reload-tiempoMedioProblema",
  TIEMPO_MIN_PROBLEMA: "reload-tiempoMinProblema"
} as const;

export function formatProblemEvent(problema: string, eventType: EventTypes): string {
    return `${problema}-${eventType}`;
}

export type EventTypes = typeof EventType[keyof typeof EventType];