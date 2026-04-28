import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EstadoUsuario } from '../../src/types/estadoUsuario.js';
import { EstadoProblema } from '../../src/types/estadoProblema.js';
import { EnvioProcesado } from '../../src/types/envioProcesado.js';
import logrosService from '../../src/servicios/logros/logrosService.js';
import logrosDAO from '../../src/dao/logrosDAO.js';

//se sustituye logrosDAO por un objeto falso para que los tests no dependan de Redis:
//guardarBloqueLogros no hace nada y getLogros devuelve [] por defecto,
//pero se pueden espiar sus llamadas con vi.mocked(logrosDAO.guardarBloqueLogros).mock.calls
vi.mock('../../src/dao/logrosDAO.js', () => ({
  default: {
    guardarBloqueLogros: vi.fn().mockResolvedValue(undefined),
    getLogros: vi.fn().mockResolvedValue([]),
  }
}));

function estadoBase(): EstadoUsuario {
  return {
    numEnvios: 0,
    problemasAC: new Set(),
    problemasNoAC: new Set(),
    resultados: new Map(),
    lenguajes: new Set(),
    lenguajesConteo: new Map(),
    lenguajesAC: new Map(),
    lenguajesProblemasResueltos: new Map(),
    diasValor: new Map(),
    rachaEnviosAC: 0,
    rachaEnviosACMax: 0,
    rachaDiasEnvio: 0,
    rachaDiasEnvioMax: 0,
    ultimoDiaEnvio: 0,
    horas: new Set(),
    logros: new Set(),
  };
}

function problemaBase(): EstadoProblema {
  return {
    envios: 0,
    enviosAC: 0,
    mejorTiempo: Infinity,
    tiempoTotal: 0,
    tiemposOrdenados: [],
    posUltimoEnvio: -1,
    tiemposEnvios: new Map(),
    resultados: new Map(),
    lenguajes: new Map(),
  };
}

function envioBase(override: any = {}): EnvioProcesado {
  return {
    envioId: 1,
    usuario: 'user1',
    problema: 'p1',
    resultado: 'AC',
    lenguaje: 'cpp',
    tiempo: 100,
    memoria: 256,
    pos: 1,
    fecha: 1000000,
    hora: 10,
    ...override
  };
}

//extrae los logros guardados para un usuario de la ultima llamada al mock
function logrosGuardados(usuario: string): string[] {
  const calls = vi.mocked(logrosDAO.guardarBloqueLogros).mock.calls;
  if (calls.length === 0) return [];
  const lastCall = calls[calls.length - 1][0];
  return lastCall.find(d => d.usuario === usuario)?.logros ?? [];
}

beforeEach(async () => {
  //resetea el estado interno del singleton y limpia el historial de mocks
  await logrosService.cargarTrofeos(new Set(), new Map(), new Map());
  vi.clearAllMocks();
});

describe('getLogroByName', () => {

  test('devuelve el logro si existe', () => {
    const logro = logrosService.getLogroByName('logro4');
    expect(logro).toBeDefined();
    expect(logro!.nombre).toBe('logro4');
  });

  test('devuelve undefined si no existe', () => {
    expect(logrosService.getLogroByName('noexiste')).toBeUndefined();
  });
});

describe('getLogros', () => {

  test('delega en logrosDAO y devuelve sus logros', async () => {
    vi.mocked(logrosDAO.getLogros).mockResolvedValueOnce(['logro4', 'logro5']);
    const result = await logrosService.getLogros('user1');
    expect(result).toEqual(['logro4', 'logro5']);
    expect(logrosDAO.getLogros).toHaveBeenCalledWith('user1');
  });
});

describe('procesarEstado (logros en tiempo real)', () => {

  test('logro14: envio AC en primer intento', async () => {
    const estado = estadoBase();
    logrosService.procesarEstado(estado, problemaBase(), envioBase({ resultado: 'AC' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro14');
  });

  test('logro14: no se otorga con envio WA', async () => {
    const estado = estadoBase();
    logrosService.procesarEstado(estado, problemaBase(), envioBase({ resultado: 'WA' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro14');
  });

  test('logro14: no se otorga si el problema ya tiene envios WA previos', async () => {
    const estado = estadoBase();
    estado.problemasNoAC.add('p1');
    logrosService.procesarEstado(estado, problemaBase(), envioBase({ resultado: 'AC', problema: 'p1' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro14');
  });

  test('logro12: racha de 5 envios AC consecutivos', async () => {
    const estado = estadoBase();
    estado.rachaEnviosAC = 5;
    logrosService.procesarEstado(estado, problemaBase(), envioBase());
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro12');
  });

  test('logro12: no se otorga con racha menor de 5', async () => {
    const estado = estadoBase();
    estado.rachaEnviosAC = 4;
    logrosService.procesarEstado(estado, problemaBase(), envioBase());
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro12');
  });

  test('logro13: racha de 7 dias consecutivos con envios', async () => {
    const estado = estadoBase();
    estado.rachaDiasEnvio = 7;
    logrosService.procesarEstado(estado, problemaBase(), envioBase());
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro13');
  });

  test('logro13: no se otorga con racha menor de 7 dias', async () => {
    const estado = estadoBase();
    estado.rachaDiasEnvio = 6;
    logrosService.procesarEstado(estado, problemaBase(), envioBase());
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro13');
  });

  test('logro15: AC en el 25% mas rapido con >= 100 envios en el problema', async () => {
    const estado = estadoBase();
    const problema = problemaBase();
    problema.envios = 100;
    problema.posUltimoEnvio = 24; //posicion 24 < 25 (25% de 100)
    logrosService.procesarEstado(estado, problema, envioBase({ resultado: 'AC' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro15');
  });

  test('logro15: no se otorga si la posicion es exactamente el 25%', async () => {
    const estado = estadoBase();
    const problema = problemaBase();
    problema.envios = 100;
    problema.posUltimoEnvio = 25; //posicion 25 no es < 25
    logrosService.procesarEstado(estado, problema, envioBase({ resultado: 'AC' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro15');
  });

  test('logro15: no se otorga si el problema tiene menos de 100 envios', async () => {
    const estado = estadoBase();
    const problema = problemaBase();
    problema.envios = 99;
    problema.posUltimoEnvio = 0;
    logrosService.procesarEstado(estado, problema, envioBase({ resultado: 'AC' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro15');
  });

  test('logro17: AC que iguala el mejor tiempo con >= 100 envios en el problema', async () => {
    const estado = estadoBase();
    const problema = problemaBase();
    problema.envios = 100;
    problema.mejorTiempo = 100;
    logrosService.procesarEstado(estado, problema, envioBase({ resultado: 'AC', tiempo: 100 }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro17');
  });

  test('logro17: no se otorga si el problema tiene menos de 100 envios', async () => {
    const estado = estadoBase();
    const problema = problemaBase();
    problema.envios = 99;
    problema.mejorTiempo = 100;
    logrosService.procesarEstado(estado, problema, envioBase({ resultado: 'AC', tiempo: 100 }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro17');
  });

});

describe('comportamiento general', () => {

  test('un logro ya obtenido no se vuelve a conceder', async () => {
    const estado = estadoBase();
    estado.logros.add('logro14');
    logrosService.procesarEstado(estado, problemaBase(), envioBase({ resultado: 'AC' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro14');
  });
});

describe('cargarTrofeos (logros de onboarding)', () => {

  test('logro1: se otorga siempre al primer bloque del usuario', async () => {
    const estado = estadoBase();
    logrosService.procesarEstado(estado, problemaBase(), envioBase());
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro1');
  });

  test('logro2: primer envio realizado', async () => {
    const estado = estadoBase();
    estado.numEnvios = 1;
    logrosService.procesarEstado(estado, problemaBase(), envioBase());
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro2');
  });

  test('logro3: 5 logros obtenidos', async () => {
    const estado = estadoBase();
    //solo logros enTiempoReal:false para que procesarEstado pueda otorgar logro14 y añadir el usuario al mapa
    estado.logros = new Set(['logro1', 'logro2', 'logro4', 'logro5', 'logro6']);
    logrosService.procesarEstado(estado, problemaBase(), envioBase({ resultado: 'AC' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).toContain('logro3');
  });

  test('logro3: no se otorga con menos de 5 logros', async () => {
    const estado = estadoBase();
    //2 logros globales + logro12 (racha) + logro14 (AC) otorgados en tiempo real = 4 total
    estado.logros = new Set(['logro1', 'logro2']);
    estado.rachaEnviosAC = 5;
    logrosService.procesarEstado(estado, problemaBase(), envioBase());
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    expect(logrosGuardados('user1')).not.toContain('logro3');
  });
});

describe('cargarTrofeos (logros de estado global)', () => {

  //inicializa el usuario en el mapa via un AC de primer intento y llama a cargarTrofeos
  async function ejecutar(estado: EstadoUsuario): Promise<string[]> {
    logrosService.procesarEstado(estado, problemaBase(), envioBase({ resultado: 'AC' }));
    await logrosService.cargarTrofeos(new Set(['user1']), new Map([['user1', estado]]), new Map());
    return logrosGuardados('user1');
  }

  test('logro4: 10 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 10; i++) estado.problemasAC.add(`p${i}`);
    expect(await ejecutar(estado)).toContain('logro4');
  });

  test('logro4: no se otorga con 9 problemas', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 9; i++) estado.problemasAC.add(`p${i}`);
    expect(await ejecutar(estado)).not.toContain('logro4');
  });

  test('logro5: 50 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 50; i++) estado.problemasAC.add(`p${i}`);
    expect(await ejecutar(estado)).toContain('logro5');
  });

  test('logro6: 100 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 100; i++) estado.problemasAC.add(`p${i}`);
    expect(await ejecutar(estado)).toContain('logro6');
  });

  test('logro7: 500 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 500; i++) estado.problemasAC.add(`p${i}`);
    expect(await ejecutar(estado)).toContain('logro7');
  });

  test('logro8: 25 problemas resueltos en C', async () => {
    const estado = estadoBase();
    estado.lenguajesProblemasResueltos.set('c', new Set(Array.from({ length: 25 }, (_, i) => `p${i}`)));
    expect(await ejecutar(estado)).toContain('logro8');
  });

  test('logro9: 25 problemas resueltos en C++', async () => {
    const estado = estadoBase();
    estado.lenguajesProblemasResueltos.set('cpp', new Set(Array.from({ length: 25 }, (_, i) => `p${i}`)));
    expect(await ejecutar(estado)).toContain('logro9');
  });

  test('logro10: 25 problemas resueltos en Java', async () => {
    const estado = estadoBase();
    estado.lenguajesProblemasResueltos.set('java', new Set(Array.from({ length: 25 }, (_, i) => `p${i}`)));
    expect(await ejecutar(estado)).toContain('logro10');
  });

  test('logro11: envios con 3 lenguajes distintos', async () => {
    const estado = estadoBase();
    estado.lenguajes = new Set(['c', 'cpp', 'java']);
    expect(await ejecutar(estado)).toContain('logro11');
  });

  test('logro11: no se otorga con menos de 3 lenguajes', async () => {
    const estado = estadoBase();
    estado.lenguajes = new Set(['c', 'cpp']);
    expect(await ejecutar(estado)).not.toContain('logro11');
  });

  test('logro18: envios en las 24 horas del dia', async () => {
    const estado = estadoBase();
    estado.horas = new Set(Array.from({ length: 24 }, (_, i) => i));
    expect(await ejecutar(estado)).toContain('logro18');
  });

  test('logro18: no se otorga si faltan horas', async () => {
    const estado = estadoBase();
    estado.horas = new Set(Array.from({ length: 23 }, (_, i) => i));
    expect(await ejecutar(estado)).not.toContain('logro18');
  });

  //TODO esto fuera de este describe
  test('varios usuarios reciben solo sus propios logros', async () => {
    const estadoUser1 = estadoBase();
    for (let i = 0; i < 10; i++) estadoUser1.problemasAC.add(`p${i}`);

    const estadoUser2 = estadoBase();
    estadoUser2.rachaEnviosAC = 5;

    logrosService.procesarEstado(estadoUser1, problemaBase(), envioBase({ usuario: 'user1', resultado: 'AC' }));
    logrosService.procesarEstado(estadoUser2, problemaBase(), envioBase({ usuario: 'user2', resultado: 'AC' }));

    const estadosUsuarios = new Map([['user1', estadoUser1], ['user2', estadoUser2]]);
    await logrosService.cargarTrofeos(new Set(['user1', 'user2']), estadosUsuarios, new Map());

    const datos = vi.mocked(logrosDAO.guardarBloqueLogros).mock.calls[0][0];
    const logrosUser1 = datos.find(d => d.usuario === 'user1')?.logros ?? [];
    const logrosUser2 = datos.find(d => d.usuario === 'user2')?.logros ?? [];

    expect(logrosUser1).toContain('logro4');
    expect(logrosUser1).not.toContain('logro12');
    expect(logrosUser2).toContain('logro12');
    expect(logrosUser2).not.toContain('logro4');
  });
});
