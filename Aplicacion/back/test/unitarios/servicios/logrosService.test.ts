import { describe, test, expect, vi, beforeEach } from 'vitest';
import { EstadoUsuario } from '../../../src/types/estados/estadoUsuario.js';
import { EstadoProblema } from '../../../src/types/estados/estadoProblema.js';
import { EnvioProcesado } from '../../../src/types/envios/envioProcesado.js';
import { CampoUsuario } from '../../../src/types/estados/camposEstadoUsuario.js';
import { CampoProblema } from '../../../src/types/estados/camposEstadoProblema.js';
import logrosService from '../../../src/servicios/logrosService.js';
import logrosDAO from '../../../src/dao/logrosDAO.js';
import { Logro } from '../../../src/servicios/logros/logro.js';
import logro14 from '../../../src/servicios/logros/calidad/logro14.js';

//se sustituye logrosDAO por un objeto falso para que los tests no dependan de Redis:
//guardarBloqueLogros no hace nada y getLogros devuelve [] por defecto,
//pero se pueden espiar sus llamadas con vi.mocked(logrosDAO.guardarBloqueLogros).mock.calls
vi.mock('../../../src/dao/logrosDAO.js', () => ({
  default: {
    guardarBloqueLogros: vi.fn().mockResolvedValue(undefined),
    getLogros: vi.fn().mockResolvedValue([]),
  }
}));

function estadoBase(): EstadoUsuario {
  return {
    [CampoUsuario.NUM_ENVIOS]: true,
    numEnvios: 0,
    [CampoUsuario.PROBLEMAS]: true,
    problemasAC: new Set(),
    problemasNoAC: new Set(),
    [CampoUsuario.RESULTADOS]: true,
    resultados: new Map(),
    [CampoUsuario.LENGUAJES]: true,
    lenguajes: new Set(),
    lenguajesConteo: new Map(),
    lenguajesAC: new Map(),
    lenguajesProblemasResueltos: new Map(),
    [CampoUsuario.DIAS_VALOR]: true,
    diasValor: new Map(),
    [CampoUsuario.RACHAS]: true,
    rachaEnviosAC: 0,
    rachaEnviosACMax: 0,
    rachaDiasEnvio: 0,
    rachaDiasEnvioMax: 0,
    ultimoDiaEnvio: 0,
    [CampoUsuario.HORAS]: true,
    horas: new Set(),
    [CampoUsuario.LOGROS]: true,
    logros: new Set(),
  };
}

function problemaBase(): EstadoProblema {
  return {
    [CampoProblema.ENVIOS]: true,
    envios: 0,
    enviosAC: 0,
    [CampoProblema.TIEMPOS]: true,
    mejorTiempo: Infinity,
    tiempoTotal: 0,
    tiemposOrdenados: [],
    posUltimoEnvio: -1,
    tiemposEnvios: new Map(),
    [CampoProblema.RESULTADOS]: true,
    resultados: new Map(),
    [CampoProblema.LENGUAJES]: true,
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

//extrae los ids de los logros guardados para un usuario de la ultima llamada al mock
function logrosGuardados(usuario: string): number[] {
  const calls = vi.mocked(logrosDAO.guardarBloqueLogros).mock.calls;
  if (calls.length === 0) return [];
  const lastCall = calls[calls.length - 1][0];
  return lastCall.find(d => d.usuario === usuario)?.logros ?? [];
}

//helper: evalua logros para el usuario del envio y persiste el resultado
//inicializa logrosActuales combinando estado.logros (ids) con logrosYaObtenidos (objetos)
async function evaluar(
    estado: EstadoUsuario,
    problema: EstadoProblema = problemaBase(),
    envio: EnvioProcesado = envioBase(),
    logrosYaObtenidos: Set<Logro> = new Set()
): Promise<void> {
    const definiciones = logrosService.getDefiniciones();
    const delEstado = new Set<Logro>(
        [...(estado.logros ?? [])].map(n => definiciones.find(l => l.id === n)!).filter(Boolean)
    );
    const logrosActuales = new Set<Logro>([...delEstado, ...logrosYaObtenidos]);

    const nuevos = logrosService.comprobarLogros({
        checkpointsLogro: new Map(),
        logrosActuales: new Map([[envio.usuario, logrosActuales]]),
        estadosUsuarios: new Map([[envio.usuario, estado]]),
        estadosProblemas: new Map([[envio.problema, problema]]),
        envio
    });
    await logrosService.guardarLogros(nuevos);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getLogros', () => {

  test('delega en logrosDAO y devuelve sus logros', async () => {
    vi.mocked(logrosDAO.getLogros).mockResolvedValueOnce([4, 5]); //logros con id 4 y 5
    const result = await logrosService.getLogros(['user1']);
    const ids = Array.from(result.get('user1')!).map(l => l.id);
    expect(ids).toContain(4);
    expect(ids).toContain(5);
    expect(logrosDAO.getLogros).toHaveBeenCalledWith('user1');
  });
});

describe('comprobarLogros (logros en tiempo real)', () => {

  test('logro14: envio AC en primer intento', async () => {
    await evaluar(estadoBase(), problemaBase(), envioBase({ resultado: 'AC' }));
    expect(logrosGuardados('user1')).toContain(14);
  });

  test('logro14: no se otorga con envio WA', async () => {
    await evaluar(estadoBase(), problemaBase(), envioBase({ resultado: 'WA' }));
    expect(logrosGuardados('user1')).not.toContain(14);
  });

  test('logro14: no se otorga si el problema ya tiene envios WA previos', async () => {
    const estado = estadoBase();
    estado.problemasNoAC!.add('p1');
    await evaluar(estado, problemaBase(), envioBase({ resultado: 'AC', problema: 'p1' }));
    expect(logrosGuardados('user1')).not.toContain(14);
  });

  test('logro12: racha de 5 envios AC consecutivos', async () => {
    const estado = estadoBase();
    estado.rachaEnviosAC = 5;
    await evaluar(estado);
    expect(logrosGuardados('user1')).toContain(12);
  });

  test('logro12: no se otorga con racha menor de 5', async () => {
    const estado = estadoBase();
    estado.rachaEnviosAC = 4;
    await evaluar(estado);
    expect(logrosGuardados('user1')).not.toContain(12);
  });

  test('logro13: racha de 7 dias consecutivos con envios', async () => {
    const estado = estadoBase();
    estado.rachaDiasEnvio = 7;
    await evaluar(estado);
    expect(logrosGuardados('user1')).toContain(13);
  });

  test('logro13: no se otorga con racha menor de 7 dias', async () => {
    const estado = estadoBase();
    estado.rachaDiasEnvio = 6;
    await evaluar(estado);
    expect(logrosGuardados('user1')).not.toContain(13);
  });

  test('logro15: AC en el 25% mas rapido con >= 100 envios en el problema', async () => {
    const problema = problemaBase();
    problema.envios = 100;
    problema.posUltimoEnvio = 24;
    await evaluar(estadoBase(), problema, envioBase({ resultado: 'AC' }));
    expect(logrosGuardados('user1')).toContain(15);
  });

  test('logro15: no se otorga si la posicion es exactamente el 25%', async () => {
    const problema = problemaBase();
    problema.envios = 100;
    problema.posUltimoEnvio = 25;
    await evaluar(estadoBase(), problema, envioBase({ resultado: 'AC' }));
    expect(logrosGuardados('user1')).not.toContain(15);
  });

  test('logro15: no se otorga si el problema tiene menos de 100 envios', async () => {
    const problema = problemaBase();
    problema.envios = 99;
    problema.posUltimoEnvio = 0;
    await evaluar(estadoBase(), problema, envioBase({ resultado: 'AC' }));
    expect(logrosGuardados('user1')).not.toContain(15);
  });

  test('logro17: AC que iguala el mejor tiempo con >= 100 envios en el problema', async () => {
    const problema = problemaBase();
    problema.envios = 100;
    problema.mejorTiempo = 100;
    await evaluar(estadoBase(), problema, envioBase({ resultado: 'AC', tiempo: 100 }));
    expect(logrosGuardados('user1')).toContain(16);
  });

  test('logro17: no se otorga si el problema tiene menos de 100 envios', async () => {
    const problema = problemaBase();
    problema.envios = 99;
    problema.mejorTiempo = 100;
    await evaluar(estadoBase(), problema, envioBase({ resultado: 'AC', tiempo: 100 }));
    expect(logrosGuardados('user1')).not.toContain(16);
  });

});

describe('comportamiento general', () => {

  test('un logro ya obtenido no se vuelve a conceder', async () => {
    await evaluar(estadoBase(), problemaBase(), envioBase({ resultado: 'AC' }), new Set([logro14]));
    expect(logrosGuardados('user1')).not.toContain(14);
  });
});

describe('comprobarLogros (logros de onboarding)', () => {

  test('logro1: se otorga siempre al primer bloque del usuario', async () => {
    await evaluar(estadoBase());
    expect(logrosGuardados('user1')).toContain(1);
  });

  test('logro2: primer envio realizado', async () => {
    const estado = estadoBase();
    estado.numEnvios = 1;
    await evaluar(estado);
    expect(logrosGuardados('user1')).toContain(2);
  });

  test('logro3: 5 logros obtenidos', async () => {
    const estado = estadoBase();
    estado.logros = new Set([1, 2, 4, 5, 6]);
    await evaluar(estado, problemaBase(), envioBase({ resultado: 'AC' }));
    expect(logrosGuardados('user1')).toContain(3);
  });

  test('logro3: no se otorga con menos de 5 logros', async () => {
    const estado = estadoBase();
    //2 logros globales + logro12 (racha) + logro14 (AC) otorgados en tiempo real = 4 total
    estado.logros = new Set([1, 2]);
    estado.rachaEnviosAC = 5;
    await evaluar(estado);
    expect(logrosGuardados('user1')).not.toContain(3);
  });
});

describe('comprobarLogros (logros de estado global)', () => {

  async function ejecutar(estado: EstadoUsuario): Promise<number[]> {
    await evaluar(estado, problemaBase(), envioBase({ resultado: 'AC' }));
    return logrosGuardados('user1');
  }

  test('logro4: 10 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 10; i++) estado.problemasAC!.add(`p${i}`);
    expect(await ejecutar(estado)).toContain(4);
  });

  test('logro4: no se otorga con 9 problemas', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 9; i++) estado.problemasAC!.add(`p${i}`);
    expect(await ejecutar(estado)).not.toContain(4);
  });

  test('logro5: 50 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 50; i++) estado.problemasAC!.add(`p${i}`);
    expect(await ejecutar(estado)).toContain(5);
  });

  test('logro6: 100 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 100; i++) estado.problemasAC!.add(`p${i}`);
    expect(await ejecutar(estado)).toContain(6);
  });

  test('logro7: 500 problemas resueltos', async () => {
    const estado = estadoBase();
    for (let i = 0; i < 500; i++) estado.problemasAC!.add(`p${i}`);
    expect(await ejecutar(estado)).toContain(7);
  });

  test('logro8: 25 problemas resueltos en C', async () => {
    const estado = estadoBase();
    estado.lenguajesProblemasResueltos!.set('c', new Set(Array.from({ length: 25 }, (_, i) => `p${i}`)));
    expect(await ejecutar(estado)).toContain(8);
  });

  test('logro9: 25 problemas resueltos en C++', async () => {
    const estado = estadoBase();
    estado.lenguajesProblemasResueltos!.set('cpp', new Set(Array.from({ length: 25 }, (_, i) => `p${i}`)));
    expect(await ejecutar(estado)).toContain(9);
  });

  test('logro10: 25 problemas resueltos en Java', async () => {
    const estado = estadoBase();
    estado.lenguajesProblemasResueltos!.set('java', new Set(Array.from({ length: 25 }, (_, i) => `p${i}`)));
    expect(await ejecutar(estado)).toContain(10);
  });

  test('logro11: envios con 3 lenguajes distintos', async () => {
    const estado = estadoBase();
    estado.lenguajes = new Set(['c', 'cpp', 'java']);
    expect(await ejecutar(estado)).toContain(11);
  });

  test('logro11: no se otorga con menos de 3 lenguajes', async () => {
    const estado = estadoBase();
    estado.lenguajes = new Set(['c', 'cpp']);
    expect(await ejecutar(estado)).not.toContain(11);
  });

  test('logro18: envios en las 24 horas del dia', async () => {
    const estado = estadoBase();
    estado.horas = new Set(Array.from({ length: 24 }, (_, i) => i));
    console.log("---------");
    console.log(estado.horas);
    expect(await ejecutar(estado)).toContain(17);
  });

  test('logro18: no se otorga si faltan horas', async () => {
    const estado = estadoBase();
    estado.horas = new Set(Array.from({ length: 23 }, (_, i) => i));
    expect(await ejecutar(estado)).not.toContain(17);
  });

  test('varios usuarios reciben solo sus propios logros', async () => {
    const estadoUser1 = estadoBase();
    for (let i = 0; i < 10; i++) estadoUser1.problemasAC!.add(`p${i}`);

    const estadoUser2 = estadoBase();
    estadoUser2.rachaEnviosAC = 5;

    const estadosUsuarios = new Map([['user1', estadoUser1], ['user2', estadoUser2]]);
    const estadosProblemas = new Map([['p1', problemaBase()]]);
    const logrosActuales = new Map<string, Set<Logro>>([['user1', new Set()], ['user2', new Set()]]);

    const nuevos1 = logrosService.comprobarLogros({
        checkpointsLogro: new Map(),
        logrosActuales,
        estadosUsuarios,
        estadosProblemas,
        envio: envioBase({ usuario: 'user1', resultado: 'AC' })
    });

    const nuevos2 = logrosService.comprobarLogros({
        checkpointsLogro: new Map(),
        logrosActuales,
        estadosUsuarios,
        estadosProblemas,
        envio: envioBase({ usuario: 'user2', resultado: 'AC' })
    });

    await logrosService.guardarLogros(new Map([...nuevos1, ...nuevos2]));

    const datos = vi.mocked(logrosDAO.guardarBloqueLogros).mock.calls[0][0];
    const logrosUser1 = datos.find(d => d.usuario === 'user1')?.logros ?? [];
    const logrosUser2 = datos.find(d => d.usuario === 'user2')?.logros ?? [];

    expect(logrosUser1).toContain(4);
    expect(logrosUser1).not.toContain(12);
    expect(logrosUser2).toContain(12);
    expect(logrosUser2).not.toContain(4);
  });
});
