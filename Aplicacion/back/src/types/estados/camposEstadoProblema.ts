export const CampoProblema = {
    ENVIOS:     'enviosProblema',
    TIEMPOS:    'tiemposProblema',
    RESULTADOS: 'resultadosProblema',
    LENGUAJES:  'lenguajesProblema',
} as const;

export type CampoProblemaKey = typeof CampoProblema[keyof typeof CampoProblema];
