export const EventType = {
  //ESTADISTICAS PROBLEMA
  ENVIOS_PROBLEMA: "reload-enviosTotalesProblema",
  MEJOR_TIEMPO_PROBLEMA: "reload-mejorTiempoProblema",
  TIEMPO_PROM_PROBLEMA: "reload-tiempoPromedioProblema",
  DIAGRAMA_PROBLEMAS: "reload-resultadosProblemas",
  DIAGRAMA_LENGUAJES: "reload-resultadosLenguajes"
} as const;

export function formatProblemEvent(problema: string, eventType: EventTypes): string {
    return `${problema}-${eventType}`;
}

export type EventTypes = typeof EventType[keyof typeof EventType];