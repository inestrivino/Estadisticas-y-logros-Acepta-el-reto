import { describe, test, expect, beforeAll, beforeEach, vi } from 'vitest';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { createClient } from 'redis';

//se mockean los emisores de sockets para que no intenten emitir nada
vi.mock('../../src/sockets/socketEmitter.js', () => ({
    routerEmitter: vi.fn(),
    conjuntoEmitter: vi.fn(),
}));

import inicializarService from '../../src/servicios/inicializarService.js';
import gestionDAO from '../../src/dao/gestionDAO.js';
import usuarioDAO from '../../src/dao/usuarioDAO.js';
import problemaDAO from '../../src/dao/problemaDAO.js';
import logrosDAO from '../../src/dao/logrosDAO.js';
import xpDAO from '../../src/dao/xpDAO.js';
import checkpointsDAO from '../../src/dao/checkpointsDAO.js';
import usuarioService from '../../src/servicios/usuarioService.js';
import xpService from '../../src/servicios/xpService.js';
import gestionService from '../../src/servicios/gestionService.js';
import estadosService from '../../src/servicios/estadosService.js';
import { CampoUsuario } from '../../src/types/estados/camposEstadoUsuario.js';
import { EnvioSinProcesarInicial } from '../../src/types/envios/envioSinProcesarInicial.js';
import { EstadoUsuario } from '../../src/types/estados/estadoUsuario.js';

let container: StartedRedisContainer;
let redis: ReturnType<typeof createClient>;

//============================ DATOS DE PRUEBA ============================

const FECHA_MARZO = Date.UTC(2026, 2, 17, 12, 0, 0);
const FECHA_MAYO = Date.UTC(2026, 4, 17, 12, 0, 0);

const NESTOR = { id: 1, name: 'Nestor', nick: 'N3STOR173', avatar: '' };
const JOHN = { id: 2, name: 'John Doe', nick: 'JOHNDOE', avatar: '' };
const RANDOLPH = { id: 3, name: 'Randolph Karter', nick: 'R4NDOLPH_K4RTER', avatar: '' };

const ENVIOS: EnvioSinProcesarInicial[] = [
    { num: 20, executionTime: 120, language: 'c', memoryUser: 1024, problem: { num: 1, title: 'P1' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 19, executionTime: 110, language: 'c', memoryUser: 1024, problem: { num: 1, title: 'P1' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 18, executionTime: 100, language: 'c', memoryUser: 1024, problem: { num: 1, title: 'P1' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 17, executionTime: 90, language: 'cpp', memoryUser: 2048, problem: { num: 2, title: 'P2' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 16, executionTime: 130, language: 'cpp', memoryUser: 2048, problem: { num: 2, title: 'P2' }, ranking: 1, result: 'WA', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 15, executionTime: 75, language: 'java', memoryUser: 4096, problem: { num: 3, title: 'P3' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 14, executionTime: 115, language: 'c', memoryUser: 1024, problem: { num: 4, title: 'P4' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 13, executionTime: 105, language: 'cpp', memoryUser: 2048, problem: { num: 4, title: 'P4' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: NESTOR },
    { num: 12, executionTime: 180, language: 'java', memoryUser: 4096, problem: { num: 1, title: 'P1' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: JOHN },
    { num: 11, executionTime: 95, language: 'java', memoryUser: 4096, problem: { num: 2, title: 'P2' }, ranking: 1, result: 'AC', submissionDate: FECHA_MARZO, user: JOHN },
    { num: 10, executionTime: 200, language: 'c', memoryUser: 1024, problem: { num: 3, title: 'P3' }, ranking: 1, result: 'AC', submissionDate: FECHA_MAYO, user: JOHN },
    { num: 9, executionTime: 210, language: 'c', memoryUser: 1024, problem: { num: 3, title: 'P3' }, ranking: 1, result: 'WA', submissionDate: FECHA_MAYO, user: JOHN },
    { num: 8, executionTime: 175, language: 'java', memoryUser: 4096, problem: { num: 4, title: 'P4' }, ranking: 1, result: 'AC', submissionDate: FECHA_MAYO, user: JOHN },
    { num: 7, executionTime: 160, language: 'cpp', memoryUser: 2048, problem: { num: 4, title: 'P4' }, ranking: 1, result: 'TLE', submissionDate: FECHA_MAYO, user: JOHN },
    { num: 6, executionTime: 85, language: 'cpp', memoryUser: 2048, problem: { num: 1, title: 'P1' }, ranking: 1, result: 'AC', submissionDate: FECHA_MAYO, user: RANDOLPH },
    { num: 5, executionTime: 125, language: 'java', memoryUser: 4096, problem: { num: 1, title: 'P1' }, ranking: 1, result: 'AC', submissionDate: FECHA_MAYO, user: RANDOLPH },
    { num: 4, executionTime: 135, language: 'java', memoryUser: 4096, problem: { num: 1, title: 'P1' }, ranking: 1, result: 'WA', submissionDate: FECHA_MAYO, user: RANDOLPH },
    { num: 3, executionTime: 150, language: 'c', memoryUser: 1024, problem: { num: 2, title: 'P2' }, ranking: 1, result: 'AC', submissionDate: FECHA_MAYO, user: RANDOLPH },
    { num: 2, executionTime: 145, language: 'c', memoryUser: 1024, problem: { num: 2, title: 'P2' }, ranking: 1, result: 'AC', submissionDate: FECHA_MAYO, user: RANDOLPH },
    { num: 1, executionTime: 140, language: 'cpp', memoryUser: 2048, problem: { num: 3, title: 'P3' }, ranking: 1, result: 'AC', submissionDate: FECHA_MAYO, user: RANDOLPH },
];

//============================ CONFIGURACION DE LOS TESTS ============================

//devuelve una pagina con datos y el resto vacias aunque debería detectar que llega al ultimo envio y parar antes
function mockFetch() {
    return vi.fn(async (input: string | URL) => {
        const url = new URL(input.toString());
        const pagina = Number(url.searchParams.get('ini') ?? url.searchParams.get('count') ?? '1');
        const submission = pagina === 1 ? ENVIOS : [];
        return new Response(JSON.stringify({ submission }), { status: 200 });
    });
}

beforeAll(async () => {
    container = await new RedisContainer('redis:alpine').start();
    redis = createClient({ url: container.getConnectionUrl() });
    redis.on('end', () => console.trace('redis closed'))
    await redis.connect();

    //se inyecta el redis de test en todos los DAOs implicados en la cadena
    for (const dao of [gestionDAO, usuarioDAO, problemaDAO, logrosDAO, xpDAO, checkpointsDAO])
        dao.setRedis(redis as any);

    //variables de entorno que usa inicializarService.generarUrl
    process.env.baseUrl = 'http://api.test/submissions';
    process.env.param1Name = 'ini';
    process.env.param2Name = 'count';

    vi.stubGlobal('fetch', mockFetch());
    await redis.flushAll();
});

//============================ DATOS DE COMPARACIONES ============================

const usuarios = ['n3stor173', 'johndoe', 'r4ndolph_k4rter'] as const;

const meses: number[] = [new Date(FECHA_MARZO).getMonth(), new Date(FECHA_MAYO).getMonth()];

const enviosPorUsuario: Map<string, number> = new Map();
for (const envio of ENVIOS) {
    const nick = envio.user.nick.toLowerCase();
    if (enviosPorUsuario.has(nick))
        enviosPorUsuario.set(nick, enviosPorUsuario.get(nick)! + 1);
    else
        enviosPorUsuario.set(nick, 1);
}

const enviosPorUsuarioMes: Map<string, Map<number, number>> = new Map();
for (const s of ENVIOS) {
    const mes = new Date(s.submissionDate).getUTCMonth();
    const nick = s.user.nick.toLowerCase();
    if (!enviosPorUsuarioMes.has(nick))
        enviosPorUsuarioMes.set(nick, new Map());
    const m = enviosPorUsuarioMes.get(nick)!;
    m.set(mes, (m.get(mes) ?? 0) + 1);
}

const problemasACUsuario: Map<string, Map<number, Set<string>>> = new Map();
for (const s of ENVIOS.filter(s => s.result === 'AC')) {
    const mes = new Date(s.submissionDate).getUTCMonth();
    const nick = s.user.nick.toLowerCase();
    if (!problemasACUsuario.has(nick))
        problemasACUsuario.set(nick, new Map());
    const m = problemasACUsuario.get(nick)!;
    if (!m.has(mes))
        m.set(mes, new Set());
    m.get(mes)!.add(s.problem.title.toLowerCase());
}
const problemasAcPorUsuarioMes: Map<string, Map<number, string[]>> = new Map(
    [...problemasACUsuario.entries()].map(([nick, mesMap]) => [
        nick,
        new Map([...mesMap.entries()].map(([mes, set]) => [mes, [...set].sort()])),
    ])
);

const problemasACGlobal: Map<string, string[]> = new Map(
    [...problemasACUsuario.entries()].map(([nick, mesMap]) => [
        nick,
        [...new Set([...mesMap.values()].flatMap(s => [...s]))].sort(),
    ])
);

//============================ TESTS ============================

describe('Carga inicial - happy path', () => {

    beforeAll(async () => {
        await redis.flushAll();
    });

    test('procesa 20 envios de 3 usuarios correctamente', async () => {
        await inicializarService.inicializar();

        //el ultimo envio procesado debe ser el 20
        expect(await gestionDAO.getUltimoEnvio()).toBe(20);

        //los 3 usuarios deben estar registrados en el indice global con sus nicks normalizados
        const usuarios = await usuarioDAO.getTodosUsuarios();
        expect(usuarios.sort()).toEqual([...usuarios].sort());

        const mes = new Date(FECHA_MARZO).getUTCMonth();

        //comprobaciones contables por usuario, derivadas directamente del array SUBMISSIONS
        for (const usuario of usuarios) {
            //numero de envios persistidos por usuario
            expect(Number(await redis.get(`usuario:${usuario}:envios`))).toBe(enviosPorUsuario.get(usuario));

            //problemas AC unicos por usuario (todos los meses)
            const problemasAC = (await redis.sMembers(`usuario:${usuario}:problemasAC`)).sort();
            expect(problemasAC).toEqual(problemasACGlobal.get(usuario));

            //la suma de xp de todos los meses debe coincidir con la xp global
            const xp = await redis.zScore('usuario:ranking', usuario);
            let xpMesTotal = 0;
            for (const m of meses)
                xpMesTotal += (await redis.zScore(`usuario:ranking:mes:${m}`, usuario)) ?? 0;
            expect(xpMesTotal).toBe(xp);

            //todos los usuarios deben haber disparado al menos 2 logros
            const logros = await redis.sMembers(`logros:${usuario}`);
            expect(logros.length).toBeGreaterThan(1);
        }
    });
});

describe('Carga inicial - reseteo de una estadistica que ademas se tiene en cuenta para la experiencia', () => {

    let estadosUsuarios: Map<string, EstadoUsuario>;
    let xpPreviaGlobal: Map<string, number>;
    let xpPreviaMes: Map<string, { mes: number, xp: number }[]>;

    let enviosMarzoPrevio: Map<string, number>;
    let enviosMayoPrevio: Map<string, number>;

    let problemasACMarzoPrevio: Map<string, number>;
    let problemasACMayoPrevio: Map<string, number>;
    let trofeosMesMarzoPrevio: Map<string, Set<string>>;
    let trofeosMesMayoPrevio: Map<string, Set<string>>;



    beforeAll(async () => {
        await redis.flushAll();

        //se hace la primera carga
        await inicializarService.inicializar();

        const mes = new Date(FECHA_MARZO).getUTCMonth();

        //se guarda el estado de los usuarios antes de reiniciar para comparar despues del reinicio
        estadosUsuarios = await estadosService.getEstadosInicialesUsuarios(new Set<string>(usuarios));

        //se guarda la xp de cada usuario antes del reseteo
        xpPreviaGlobal = new Map(await Promise.all(usuarios.map(async nick => [nick, await xpDAO.getXPUsuario(nick)] as const)));

        xpPreviaMes = new Map();
        for (const usuario of usuarios) {
            xpPreviaMes.set(usuario, await xpDAO.getXPUsuarioPorMes(usuario));
        }

        //se guardan las estadisticas antes del reseteo
        enviosMarzoPrevio = await usuarioDAO.getNumEnviosMes(new Date(FECHA_MARZO).getMonth());
        enviosMayoPrevio = await usuarioDAO.getNumEnviosMes(new Date(FECHA_MAYO).getMonth());

        problemasACMarzoPrevio = await usuarioDAO.getProblemasACMes(new Date(FECHA_MARZO).getMonth());
        problemasACMayoPrevio = await usuarioDAO.getProblemasACMes(new Date(FECHA_MAYO).getMonth());
        trofeosMesMarzoPrevio = await logrosDAO.getLogrosMes(new Date(FECHA_MARZO).getMonth());
        trofeosMesMayoPrevio = await logrosDAO.getLogrosMes(new Date(FECHA_MAYO).getMonth());

        //se hacen manualmente las acciones que haria comprobarVersiones de checkpointService si se reiniciara la estadistica
        const idsReseteados = new Set<string>([CampoUsuario.NUM_ENVIOS]);
        await checkpointsDAO.setCheckpointStat(CampoUsuario.NUM_ENVIOS, 0);
        await usuarioService.resetearCamposUsuarios(idsReseteados);
        await xpService.resetearXP();
        await xpService.borrarStatsMesReseteadas(idsReseteados);
        await xpService.recalcularXPGlobal();
        await xpService.recalcularXPPorMes();
        await gestionService.resetContadorEnvios();
    });

    test('al resetear los estados de los usuarios se quedan con las estadisticas correctas', async () => {

        const nuevosEstadosUsuarios: Map<string, EstadoUsuario> = await estadosService.getEstadosInicialesUsuarios(new Set<string>(usuarios));

        //los estados de los usuarios deben ser los mismos que antes salvo el numero de envios, que se ha reseteado a 0 para todos
        for (const nick of usuarios) {
            const estadoPrevio = estadosUsuarios.get(nick)!;
            const estadoNuevo = nuevosEstadosUsuarios.get(nick)!;
            const esperado: EstadoUsuario = { ...estadoPrevio, numEnvios: 0 };
            expect(estadoNuevo).toEqual(esperado);
        }

    });

    test('al resetear la experiencia global y por mes se calcula correctamente', async () => {

        //la xp global y por mes deben haber sido recalculadas y coincidir con la xp previa
        for (const usuario of usuarios) {

            const currentXP = await xpDAO.getXPUsuario(usuario);

            //la experiencia despues de reiniciar debe ser la misma menos 1 por cada envio que se ha quitado
            expect(currentXP).toBe(xpPreviaGlobal.get(usuario)! - enviosPorUsuario.get(usuario)!);

            //se ve que la experiencia por mes es la previa menos los envios que se hicieron ese mes
            const currentXPMes = await xpDAO.getXPUsuarioPorMes(usuario);
            for (const mes of meses) {
                const mesActual = currentXPMes[mes].mes;
                const mesXpPrevia = xpPreviaMes.get(usuario)![mes].xp;
                const enviosMes = enviosPorUsuarioMes.get(usuario)!.get(mesActual) ?? 0;
                const mesXpCurrent = currentXPMes[mes].xp;
                expect(mesXpCurrent).toBe(mesXpPrevia - enviosMes);
            }

        }
    });

    test('al resetear las estadísticas por mes se resetean', async () => {
        const enviosMarzo = await usuarioDAO.getNumEnviosMes(new Date(FECHA_MARZO).getMonth());
        const enviosMayo = await usuarioDAO.getNumEnviosMes(new Date(FECHA_MAYO).getMonth());

        const problemasACMarzo = await usuarioDAO.getProblemasACMes(new Date(FECHA_MARZO).getMonth());
        const problemasACMayo = await usuarioDAO.getProblemasACMes(new Date(FECHA_MAYO).getMonth());
        const trofeosMesMarzo = await logrosDAO.getLogrosMes(new Date(FECHA_MARZO).getMonth());
        const trofeosMesMayo = await logrosDAO.getLogrosMes(new Date(FECHA_MAYO).getMonth());

        //los envios por mes deben haberse borrado al ser la estadistica reseteada
        expect(enviosMarzo.size).toBe(0);
        expect(enviosMayo.size).toBe(0);

        //el resto de estadisticas por mes no deben haber cambiado
        expect(problemasACMarzo).toEqual(problemasACMarzoPrevio);
        expect(problemasACMayo).toEqual(problemasACMayoPrevio);
        expect(trofeosMesMarzo).toEqual(trofeosMesMarzoPrevio);
        expect(trofeosMesMayo).toEqual(trofeosMesMayoPrevio);
    });
});

//TODO probar añadir un nuevo logro


//TODO probar a añadir una nueva estadística


//TODO probar a resetear una estadística que no tenga que ver con la experiencia


//TODO poner un campo para resetear la experiencia y se haga lo que se hace ahora en checkpointService pero sin haberse reseteado ninguna estadística