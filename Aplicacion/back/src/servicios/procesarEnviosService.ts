import problemaService from "./problemaService.js";
import usuarioService from "./usuarioService.js";
import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import { EstadoProblema } from "../types/estados/estadoProblema.js";
import logrosService from "./logrosService.js";
import { EnvioSinProcesarInicial } from "../types/envios/envioSinProcesarInicial.js";
import { EnvioSinProcesarEvent } from "../types/envios/envioSinProcesarEvent.js";
import { EnvioProcesado } from "../types/envios/envioProcesado.js";
import { conjuntoEmitter, routerEmitter } from "../sockets/socketEmitter.js";
import xpService from "./xpService.js";
import estadosService from "./estadosService.js";
import gestionService from "./gestionService.js";
import checkpointsService from "./checkpointsService.js";
import { Logro } from "./logros/logro.js";

type ResultadoActualizarEstados = {
    estadosUsuarios: Map<string, EstadoUsuario>
    estadosProblemas: Map<string, EstadoProblema>
    estadosPorMes: EstadosPorMes
    nuevosLogros: Map<string, Set<Logro>>
    nuevosLogrosPorMes: Map<number, Map<string, Set<Logro>>>
};

type EstadosPorMes = {
    primerMes: number
    estadosFinalesPorMes: Map<number, Map<string, EstadoUsuario>>
}

class ProcesarEnviosService {

    /**
     * Parsea, procesa y persiste un bloque de envios de carga historica.
     * Actualiza el progreso de carga (ultimo envio, pagina y porcentaje) y notifica al frontend.
     * @param bloque - Array de envios sin procesar junto con su numero de pagina de origen.
     * @param plan - Plan de recalculo (no se usa directamente, los checkpoints en Redis ya filtran).
     */
    public async procesarBloqueEnviosInicial(bloque: { envio: EnvioSinProcesarInicial, numPagina: number }[]) {

        //cada elemento del bloque se parsea
        const enviosProcesados = bloque.map(e => this.parseEnvioInicial(e.envio));

        //conjunto de problemas y usuarios que se han modificado para luego recargar el front
        const problemas: Set<string> = new Set<string>();
        const usuarios: Set<string> = new Set<string>();
        for (const envio of enviosProcesados) {
            usuarios.add(envio.usuario);
            problemas.add(envio.problema);
        }

        await this.procesarBloqueEnvios(enviosProcesados, usuarios, problemas);

        //marca cual es ahora el ultimo envio procesado y la ultima pagina donde estaba
        await gestionService.setUltimoEnvioYPagina(enviosProcesados[enviosProcesados.length - 1].envioId, bloque[bloque.length - 1].numPagina);

        //marca el nuevo porcentaje de carga completada
        const porcentaje = await gestionService.calcularPorcentajeCarga(bloque[bloque.length - 1].numPagina);

        //avisa a los diagramas para que se actualicen
        conjuntoEmitter(problemas, usuarios, porcentaje);
    }

    /**
     * Parsea, procesa y persiste un bloque de envios recibidos en tiempo real.
     * Notifica al frontend por cada envio individualmente via routerEmitter.
     * @param bloque - Array de envios sin procesar recibidos desde el consumer.
     */
    public async procesarBloqueEnviosEvent(bloque: EnvioSinProcesarEvent[]) {
        //cada elemento del bloque se parsea
        const enviosProcesados = bloque.map(e => this.parseEnvioEvent(e));

        const problemas: Set<string> = new Set<string>();
        const usuarios: Set<string> = new Set<string>();
        for (const envio of enviosProcesados) {
            usuarios.add(envio.usuario);
            problemas.add(envio.problema);
        }
        this.procesarBloqueEnvios(enviosProcesados, usuarios, problemas);

        //avisa a los diagramas para que se actualicen
        for (const envioProcesado of enviosProcesados)
            routerEmitter(envioProcesado);
    }

    /**
     * Funcion principal que calcula logros y XP, y persiste las estadisticas de un bloque de envios ya procesados.
     * Carga los checkpoints actuales de cada calculador y logro para que las piezas ya
     * actualizadas puedan saltarse los envios que ya tenian procesados.
     * @param enviosProcesados - Array de envios en formato interno (ordenados por envioId ascendente).
     * @param usuarios - Conjunto de identificadores de usuario presentes en el bloque.
     * @param problemas - Conjunto de identificadores de problema presentes en el bloque.
     */
    private async procesarBloqueEnvios(enviosProcesados: EnvioProcesado[], usuarios: Set<string>, problemas: Set<string>) {

        //TODO quizas separar esto en dos funciones para que quede mejor
        
        //se cargan los checkpoints actuales de cada calculador y logro
        const { checkpointsUsuarios, checkpointsProblemas } = await checkpointsService.cargarCheckpointsStat(); //TODO separar y que esto sea una funcion cada uno
        const checkpointsLogro = await checkpointsService.cargarCheckpointsLogro();
        const checkpoints = new Map<string, Map<string, number>>([
            ["usuarios", checkpointsUsuarios],
            ["problemas", checkpointsProblemas],
            ["logros", checkpointsLogro]
        ]);

        //Se sacan los logros actuales de los usuraios y estados actuales que van a cambiar
        const estadosUsuariosIniciales: Map<string, EstadoUsuario> = await estadosService.getEstadosInicialesUsuarios(usuarios);
        //const estadosProblemasIniciales: Map<string, EstadoProblema> = await estadosService.getEstadosInicialesProblemas(problemas);
        const logrosActuales: Map<string, Set<Logro>> = await logrosService.getLogros([...usuarios]);

        //============ACTUALIZACION DE LOS ESTADOS============

        //copia de los logrosActuales para no perder la referencia a los que se tienen al principio del bloque
        const copiaLogrosActuales: Map<string, Set<Logro>> = new Map([...logrosActuales].map(([key, values]) => [key, new Set(values)]))

        //se actualizan los estados aplicando cada envio del bloque en orden, y se procesan los logros de estado global con cada envio
        let { estadosUsuarios, estadosProblemas, estadosPorMes, nuevosLogros, nuevosLogrosPorMes } = await this.iterarBloque(enviosProcesados, copiaLogrosActuales, checkpoints);

        //SE PERSISTEN LOS logros, XP Y ESTADOS DE USUARIOS Y PROBLEMAS

        const lastEnvioId = enviosProcesados[enviosProcesados.length - 1].envioId;

        //se persisten los datos de las estadisticas
        await usuarioService.registrarEstadosUsuarios(estadosUsuarios);
        await problemaService.registrarEstadosProblemas(estadosProblemas);

        //se guardan globalmente todos los logros nuevos del bloque
        await logrosService.guardarLogros(nuevosLogros);
        //se guardan los logros nuevos por mes (solo ultimos 12 meses)
        await logrosService.guardarLogrosPorMes(nuevosLogrosPorMes);

        //se procesan los puntos de xp de cada usuario y se registra la evolucion por mes
        await xpService.procesarXP(estadosUsuariosIniciales, estadosUsuarios, estadosPorMes.estadosFinalesPorMes, nuevosLogrosPorMes);

        //se avanzan los checkpoints en Redis de las stats y logros que quedaron por detras del bloque
        await checkpointsService.avanzarCheckpoints(checkpoints, lastEnvioId);
    }

    /**
     * Itera los envios del bloque en orden, actualizando estados y evaluando logros en tiempo real por el camino.
     * @param enviosProcesados - Array de envios ya parseados al formato interno.
     * @param checkpoints - Checkpoints actuales de cada calculador y logro para filtrar los envios ya procesados por cada uno.
     * @returns Estados finales de usuarios y problemas tras recorrer el bloque, y los estados finales agrupados por mes.
     */
    private async iterarBloque(
            enviosProcesados: EnvioProcesado[],
            logrosActuales: Map<string, Set<Logro>>,
            checkpoints: Map<string, Map<string, number>>
        ): Promise<ResultadoActualizarEstados>
        {

        //ultimo envio que proceso cada calculador
        const checkpointsUsuarios = checkpoints.get("usuarios")!;
        const checkpointsProblemas = checkpoints.get("problemas")!;
        const checkpointsLogro = checkpoints.get("logros")!;
        
        //se actualizan los estados aplicando solo los calculadores y logros cuyo checkpoint
        //sea menor que el envioId actual, los ya al dia se saltan ese envio
        let envio: EnvioProcesado = enviosProcesados[0];
        let estadosUsuarios: Map<string, EstadoUsuario> = new Map();
        let estadosProblemas: Map<string, EstadoProblema> = new Map();

        //se guardan los meses que hayan cambiado de experiencian con este bloque de envios
        const primerMes = envio.mes;
        const estadosFinalesPorMes: Map<number, Map<string, EstadoUsuario>> = new Map();
        const nuevosLogros: Map<string, Set<Logro>> = new Map();
        const nuevosLogrosPorMes: Map<number, Map<string, Set<Logro>>> = new Map();

        for await ({ estadosUsuarios, estadosProblemas, envio } of estadosService.getEstadosActualizados(
            enviosProcesados,
            checkpointsUsuarios,
            checkpointsProblemas,
            estadosUsuarios,
            estadosProblemas
        )) {

            const nuevoslogroEnvio = logrosService.comprobarLogros(
                { checkpointsLogro, logrosActuales, estadosUsuarios, estadosProblemas, envio }
            );

            //se acumulan globalmente todos los logros nuevos independientemente de la fecha
            for (const [usuario, logros] of nuevoslogroEnvio) {
                if (!nuevosLogros.has(usuario)) nuevosLogros.set(usuario, new Set());
                for (const logro of logros) nuevosLogros.get(usuario)!.add(logro);
            }

            //se guarda el estado final del mes si es uno de los ultimos meses
            const hoy = new Date().setUTCHours(0,0,0,0);
            const haceUnAnio = hoy.valueOf() / 1000 - 365 * 24 * 60 * 60;
            if (envio.fecha >= haceUnAnio) {

                estadosFinalesPorMes.set(envio.mes, structuredClone(estadosUsuarios));

                if (!nuevosLogrosPorMes.has(envio.mes))
                    nuevosLogrosPorMes.set(envio.mes, new Map());
                const meslogros = nuevosLogrosPorMes.get(envio.mes)!;
                for (const [usuario, logros] of nuevoslogroEnvio) {
                    if (!meslogros.has(usuario)) meslogros.set(usuario, new Set());
                    for (const logro of logros) meslogros.get(usuario)!.add(logro);
                }
            }
        }

        return { estadosUsuarios, estadosProblemas, estadosPorMes: { primerMes, estadosFinalesPorMes }, nuevosLogros, nuevosLogrosPorMes };
    }

    /**
     * Convierte un envio de carga inicial al formato interno procesado.
     * @param envio - Envio en formato plano devuelto por la API de historico.
     * @returns Envio transformado a EnvioProcesado.
     */
    private parseEnvioInicial(envio: EnvioSinProcesarInicial): EnvioProcesado {

        //si el envio no tiene usuario se pone este por defecto
        if (!envio.user)
            envio.user = { id: 0, name: "N0USER173", nick: "N0USER173", avatar: "https://aceptaelreto.com/pub/user/noavatar.jpg" };

        const fecha = new Date(envio.submissionDate);
        const inicioDia = new Date(fecha);
        inicioDia.setUTCHours(0, 0, 0, 0);

        const envioProcesado: EnvioProcesado = {
            envioId: envio.num,
            usuario: envio.user.nick.toLowerCase().normalize("NFC").trim(),
            problema: envio.problem.title.toLowerCase().normalize("NFC").trim(),
            //categoria: envio.categoria, //TODO categorias problemas
            resultado: envio.result,
            lenguaje: envio.language,
            tiempo: envio.executionTime,
            memoria: envio.memoryUser, //TODO diria que esto no lo usamos en ningun momento
            pos: envio.ranking, //TODO diria que esto tampoco
            fecha: inicioDia.getTime() / 1000,
            hora: fecha.getUTCHours(),
            mes: fecha.getUTCMonth()
        };

        return envioProcesado;
    }

    /**
     * Convierte un evento en tiempo real al formato interno procesado.
     * @param evento - Evento recibido del consumer con el envio y datos del problema anidados.
     * @returns Envio transformado a EnvioProcesado.
     */
    private parseEnvioEvent(evento: EnvioSinProcesarEvent): EnvioProcesado {

        const envio = evento.envio;
        const problema = evento.problema;

        const fecha = new Date(envio.sbt * 1000);
        const inicioDia = new Date(fecha);
        inicioDia.setUTCHours(0, 0, 0, 0);

        const envioProcesado: EnvioProcesado = {
            envioId: envio.sid,
            usuario: envio.nick.toLowerCase().normalize("NFC").trim(),
            problema: problema.title.toLowerCase().normalize("NFC").trim(),
            //categoria: envio.categoria, //TODO categorias problemas
            resultado: envio.ver,
            lenguaje: envio.lan,
            tiempo: envio.run / 1000,
            memoria: envio.mem, //TODO diria que esto no lo usamos en ningun momento
            pos: envio.rank, //TODO diria que esto tampoco
            fecha: inicioDia.getTime() / 1000,
            hora: fecha.getUTCHours(),
            mes: fecha.getUTCMonth()
        };

        return envioProcesado;
    }
}

export default new ProcesarEnviosService();
