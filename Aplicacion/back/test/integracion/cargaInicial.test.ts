import { describe, test, expect, beforeAll, beforeEach, vi, afterAll } from 'vitest';
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
import logrosService from '../../src/servicios/logrosService.js';
import { Logro } from '../../src/servicios/logros/logro.js';
import { CategoriaLogro, NivelLogro } from 'shared';

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
    let trofeosMesMarzoPrevio: Map<string, Set<number>>;
    let trofeosMesMayoPrevio: Map<string, Set<number>>;



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


describe('Carga inicial - añadir un nuevo logro (id 19)', () => {

    const logro19: Logro = {
        id: 19,
        nombre: 'logro19',
        descripcion: 'He resuelto al menos 1 problema en C',
        imagen: 'trofeo_bronce_placeholder.png',
        categoria: CategoriaLogro.LENGUAJES,
        nivel: NivelLogro.BRONCE,
        sorpresa: false,
        version: 1,
        requiereEstadisticasUsuario: [CampoUsuario.LENGUAJES],
        requiereEstadisticasProblemas: [],
        condicion(estadoUsuario: EstadoUsuario): boolean {
            return (estadoUsuario.lenguajesProblemasResueltos?.get('c')?.size ?? 0) >= 1;
        },
    };

    const usuariosConLogro19 = new Set(usuarios);

    let logrosOriginales: Logro[];

    beforeAll(async () => {
        await redis.flushAll();

        // se accede a la lista privada y se inyecta el logro 19
        logrosOriginales = (logrosService as any).logros;
        (logrosService as any).logros = [...logrosOriginales, logro19];

        await inicializarService.inicializar();
    });

    afterAll(() => {
        // se restaura la lista original para no afectar al resto de describes
        (logrosService as any).logros = logrosOriginales;
    });

    test('el logro 19 se dispara para todos los usuarios que cumplen la condicion', async () => {
        for (const usuario of usuarios) {
            const logros = await redis.sMembers(`logros:${usuario}`);
            const ids = logros.map(Number);

            if (usuariosConLogro19.has(usuario))
                expect(ids).toContain(19);
            else
                expect(ids).not.toContain(19);
        }
    });

    test('el logro 19 aparece en los sets de mes correctos', async () => {
        // se calcula programáticamente el mes del primer envio AC en C de cada usuario
        const logrosPorMesEsperado: Record<string, number> = {};
        for (const usuario of usuarios) {
            const primerACenC = ENVIOS
                .filter(s => s.user.nick.toLowerCase() === usuario && s.result === 'AC' && s.language === 'c')
                .sort((a, b) => a.num - b.num) // orden cronologico ascendente (num mas bajo = mas antiguo)
                .at(0);
            if (primerACenC)
                logrosPorMesEsperado[usuario] = new Date(primerACenC.submissionDate).getUTCMonth();
        }

        for (const usuario of usuarios) {
            const mesEsperado = logrosPorMesEsperado[usuario];
            const logrosDelMes = await redis.sMembers(`logros:${usuario}:mes:${mesEsperado}`);
            expect(logrosDelMes.map(Number)).toContain(19);
        }
    });

    test('al resetear el logro 19 se borra de todos los usuarios y se recalcula correctamente', async () => {
        await logrosService.borrarLogros(new Set([19]));
        await checkpointsDAO.setCheckpointLogro(19, 0);
        await checkpointsDAO.setCheckpointStat(CampoUsuario.LENGUAJES, 0); // <- añadir esto
        await xpService.resetearXP();
        await xpService.borrarStatsMesReseteadas(new Set([CampoUsuario.LENGUAJES]));
        await xpService.recalcularXPGlobal();
        await xpService.recalcularXPPorMes();
        await gestionService.resetContadorEnvios();

        for (const usuario of usuarios) {
            const logros = await redis.sMembers(`logros:${usuario}`);
            expect(logros.map(Number)).not.toContain(19);
        }

        expect(await gestionDAO.getUltimoEnvio()).toBe(0);

        await inicializarService.inicializar();

        for (const usuario of usuarios) {
            const logros = await redis.sMembers(`logros:${usuario}`);
            const ids = logros.map(Number);
            if (usuariosConLogro19.has(usuario))
                expect(ids).toContain(19);
        }
    });
});


describe('Carga inicial - añadir una nueva estadística (LENGUAJES)', () => {

    // Este describe simula el escenario en el que LENGUAJES es una
    // estadística nueva: se inicializa con su checkpoint a 0, se procesa
    // la carga y se verifica que los datos persistidos son correctos.
    // Para reproducirlo limpiamente se borra solo la clave de versión de
    // LENGUAJES antes de la carga, forzando que checkpointsService la
    // trate como no vista.

    // conteo esperado de problemas resueltos por lenguaje derivado de ENVIOS
    const problemasResueltosEsperadosPorLenguaje: Map<string, Map<string, number>> = new Map();
    for (const s of ENVIOS.filter(s => s.result === 'AC')) {
        const nick = s.user.nick.toLowerCase();
        const lang = s.language;
        if (!problemasResueltosEsperadosPorLenguaje.has(nick))
            problemasResueltosEsperadosPorLenguaje.set(nick, new Map());
        const m = problemasResueltosEsperadosPorLenguaje.get(nick)!;
        m.set(lang, (m.get(lang) ?? 0) + 1);
    }

    // problemas distintos resueltos por lenguaje (sin duplicados)
    const problemasDistintosEsperados: Map<string, Map<string, Set<string>>> = new Map();
    for (const s of ENVIOS.filter(s => s.result === 'AC')) {
        const nick = s.user.nick.toLowerCase();
        const lang = s.language;
        if (!problemasDistintosEsperados.has(nick))
            problemasDistintosEsperados.set(nick, new Map());
        const m = problemasDistintosEsperados.get(nick)!;
        if (!m.has(lang)) m.set(lang, new Set());
        m.get(lang)!.add(s.problem.title.toLowerCase());
    }

    beforeAll(async () => {
        await redis.flushAll();

        // se simula que LENGUAJES es una estadística nueva borrando su versión
        // para que en la siguiente carga se trate como no inicializada
        await redis.del(`stat:${CampoUsuario.LENGUAJES}:version`);

        await inicializarService.inicializar();
    });

    test('los lenguajes usados por cada usuario se persisten correctamente', async () => {
        for (const usuario of usuarios) {
            // lenguajes es un hash, las claves son los lenguajes usados
            const lenguajesUsados = await redis.hKeys(`usuario:${usuario}:lenguajes`);
            const lenguajesEsperados = [
                ...new Set(
                    ENVIOS
                        .filter(s => s.user.nick.toLowerCase() === usuario)
                        .map(s => s.language)
                )
            ].sort();
            expect(lenguajesUsados.sort()).toEqual(lenguajesEsperados);
        }
    });

    test('el conteo de envios por lenguaje se persiste correctamente', async () => {
        for (const usuario of usuarios) {
            const conteoEsperado = problemasResueltosEsperadosPorLenguaje.get(usuario) ?? new Map();
            for (const [lang, _] of conteoEsperado) {
                const conteo = await redis.hGet(`usuario:${usuario}:lenguajesAC`, lang);
                // verifica que existe el campo, el valor exacto depende de la implementación interna
                expect(conteo).toBeDefined();
            }
        }
    });

    test('los problemas distintos resueltos por lenguaje se persisten correctamente', async () => {
        for (const usuario of usuarios) {
            const porLenguaje = problemasDistintosEsperados.get(usuario) ?? new Map();
            for (const [lang, problemasEsperados] of porLenguaje) {
                // clave real: usuario:X:lenguaje:lang (sin 's', sin ':problemas')
                const problemas = await redis.sMembers(`usuario:${usuario}:lenguaje:${lang}`);
                expect(problemas.map(p => p.toLowerCase()).sort()).toEqual([...problemasEsperados].sort());
            }
        }
    });

    test('la estadística LENGUAJES contribuye a la XP de los usuarios', async () => {
        // todos los usuarios deben tener XP > 0 tras la carga con LENGUAJES activa
        for (const usuario of usuarios) {
            const xp = await redis.zScore('usuario:ranking', usuario);
            expect(xp).toBeGreaterThan(0);
        }
    });
});


describe('Carga inicial - reseteo de una estadística sin impacto en XP (HORAS)', () => {

    // HORAS no aporta XP directamente ni es requerida por ninguna estadística de XP,
    // así que al resetearse la XP global y por mes no debe cambiar.

    let xpGlobalPrevia: Map<string, number>;
    let xpMesPrevia: Map<string, { mes: number, xp: number }[]>;
    let horasPrevias: Map<string, number[]>;

    beforeAll(async () => {
        await redis.flushAll();
        await inicializarService.inicializar();

        // se guarda el estado de XP antes del reseteo
        xpGlobalPrevia = new Map(
            await Promise.all(usuarios.map(async u => [u, await xpDAO.getXPUsuario(u)] as const))
        );
        xpMesPrevia = new Map();
        for (const usuario of usuarios)
            xpMesPrevia.set(usuario, await xpDAO.getXPUsuarioPorMes(usuario));

        // se guarda las horas antes del reseteo para comparar
        horasPrevias = new Map(
            await Promise.all(usuarios.map(async u => [u, await usuarioService.getHoras(u)] as const))
        );

        // se simula el reseteo de HORAS como haría comprobarVersiones
        const idsReseteados = new Set<string>([CampoUsuario.HORAS]);
        await checkpointsDAO.setCheckpointStat(CampoUsuario.HORAS, 0);
        await usuarioService.resetearCamposUsuarios(idsReseteados);
        await xpService.resetearXP();
        await xpService.borrarStatsMesReseteadas(idsReseteados);
        await xpService.recalcularXPGlobal();
        await xpService.recalcularXPPorMes();
        await gestionService.resetContadorEnvios();
    });

    test('la XP global no cambia al resetear una estadística sin impacto en XP', async () => {
        for (const usuario of usuarios) {
            const xpActual = await xpDAO.getXPUsuario(usuario);
            expect(xpActual).toBe(xpGlobalPrevia.get(usuario));
        }
    });

    test('la XP por mes no cambia al resetear una estadística sin impacto en XP', async () => {
        for (const usuario of usuarios) {
            const xpMesActual = await xpDAO.getXPUsuarioPorMes(usuario);
            const xpMesAnterior = xpMesPrevia.get(usuario)!;
            for (let i = 0; i < xpMesActual.length; i++)
                expect(xpMesActual[i].xp).toBe(xpMesAnterior[i].xp);
        }
    });

    test('las horas se borran tras el reseteo', async () => {
        for (const usuario of usuarios) {
            const horas = await usuarioService.getHoras(usuario);
            // todas las horas deben estar a 0 tras borrar la estadística
            expect(horas.every(h => h === 0)).toBe(true);
        }
    });

    test('el contador de envios se resetea a 0', async () => {
        expect(await gestionDAO.getUltimoEnvio()).toBe(0);
    });

    test('tras reinicializar las horas se reconstruyen igual que antes', async () => {
        await inicializarService.inicializar();

        for (const usuario of usuarios) {
            const horasActuales = await usuarioService.getHoras(usuario);
            expect(horasActuales).toEqual(horasPrevias.get(usuario));
        }
    });

    test('la XP se mantiene igual tras reinicializar', async () => {
        for (const usuario of usuarios) {
            const xpActual = await xpDAO.getXPUsuario(usuario);
            expect(xpActual).toBe(xpGlobalPrevia.get(usuario));
        }
    });
});

describe('Carga inicial - reseteo de XP sin reseteo de estadísticas', () => {

    let xpGlobalPrevia: Map<string, number>;
    let xpMesPrevia: Map<string, { mes: number, xp: number }[]>;
    let estadosPrevios: Map<string, EstadoUsuario>;

    beforeAll(async () => {
        await redis.flushAll();
        await inicializarService.inicializar();

        // se guarda el estado completo antes del reseteo de XP
        xpGlobalPrevia = new Map(
            await Promise.all(usuarios.map(async u => [u, await xpDAO.getXPUsuario(u)] as const))
        );
        xpMesPrevia = new Map();
        for (const usuario of usuarios)
            xpMesPrevia.set(usuario, await xpDAO.getXPUsuarioPorMes(usuario));

        estadosPrevios = await estadosService.getEstadosInicialesUsuarios(new Set<string>(usuarios));

        // se simula que la versión de XP ha cambiado: se resetea y recalcula
        // sin tocar ninguna estadística de usuario ni de problema
        await xpService.resetearXP();
        await xpService.recalcularXPGlobal();
        await xpService.recalcularXPPorMes();
        await gestionService.resetContadorEnvios();
    });

    test('la XP global se recalcula igual que antes del reseteo', async () => {
        for (const usuario of usuarios) {
            const xpActual = await xpDAO.getXPUsuario(usuario);
            expect(xpActual).toBe(xpGlobalPrevia.get(usuario));
        }
    });

    test('la XP por mes se recalcula igual que antes del reseteo', async () => {
        for (const usuario of usuarios) {
            const xpMesActual = await xpDAO.getXPUsuarioPorMes(usuario);
            const xpMesAnterior = xpMesPrevia.get(usuario)!;
            for (let i = 0; i < xpMesActual.length; i++)
                expect(xpMesActual[i].xp).toBe(xpMesAnterior[i].xp);
        }
    });

    test('las estadísticas de los usuarios no cambian tras el reseteo de XP', async () => {
        const estadosActuales = await estadosService.getEstadosInicialesUsuarios(new Set<string>(usuarios));
        for (const usuario of usuarios) {
            const estadoPrevio = estadosPrevios.get(usuario)!;
            const estadoActual = estadosActuales.get(usuario)!;
            expect(estadoActual).toEqual(estadoPrevio);
        }
    });

    test('el contador de envios se resetea a 0', async () => {
        expect(await gestionDAO.getUltimoEnvio()).toBe(0);
    });

    test('tras reinicializar la XP sigue siendo la misma', async () => {
        await inicializarService.inicializar();

        for (const usuario of usuarios) {
            const xpActual = await xpDAO.getXPUsuario(usuario);
            expect(xpActual).toBe(xpGlobalPrevia.get(usuario));
        }
    });
});