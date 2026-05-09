export const CampoUsuario = {
    NUM_ENVIOS: 'numEnviosUsuario',
    RACHAS:     'rachasUsuario',
    PROBLEMAS:  'problemasUsuario',
    HORAS:      'horasUsuario',
    RESULTADOS: 'resultadosUsuario',
    LENGUAJES:  'lenguajesUsuario',
    DIAS_VALOR: 'diasValorUsuario',
    LOGROS:     'logrosUsuario',
} as const;

export type CampoUsuarioKey = typeof CampoUsuario[keyof typeof CampoUsuario];
