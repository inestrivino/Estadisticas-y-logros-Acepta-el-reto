import problemaService from "./problemaService.js";
import usuarioService from "./usuarioService.js";
import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import { EstadoProblema } from "../types/estados/estadoProblema.js";
import logrosService from "./logros/logrosService.js";
import { EnvioSinProcesarInicial } from "../types/envios/envioSinProcesarInicial.js";
import { EnvioSinProcesarEvent } from "../types/envios/envioSinProcesarEvent.js";
import { EnvioProcesado } from "../types/envios/envioProcesado.js";
import { conjuntoEmitter, routerEmitter } from "../sockets/socketEmitter.js";
import xpService from "./xpService.js";
import estadosService from "./estadosService.js";
import gestionService from "./gestionService.js";
import checkpointsService from "./checkpointsService.js";

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
        console.log(" + Bloque insertado en la base de datos\n");

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

        //se cargan los checkpoints actuales de cada calculador y logro
        const { checkpointsUsuarios, checkpointsProblemas } = await checkpointsService.cargarCheckpointsStat();
        const checkpointsLogro = await checkpointsService.cargarCheckpointsLogro();

        //de los estados que van a cambiar se saca el estado actual de la base de datos
        const {estadosUsuariosIniciales, estadosProblemasIniciales} = await estadosService.getEstadosIniciales(usuarios, problemas);

        const checkpoints = new Map<string, Map<string, number>>([
            ["usuarios", checkpointsUsuarios],
            ["problemas", checkpointsProblemas],
            ["logros", checkpointsLogro]
        ]);

        //ACTUALIZACION DE LOS ESTADOS

        //se actualizan los estados aplicando cada envio del bloque en orden, y se procesan los logros de estado global con cada envio
        let { estadosUsuarios, estadosProblemas } = await this.actualizarEstados(enviosProcesados, checkpoints);

        //SE PERSISTEN LOS TROFEOS, XP Y ESTADOS DE USUARIOS Y PROBLEMAS

        const lastEnvioId = enviosProcesados[enviosProcesados.length - 1].envioId;

        //se persisten los datos
        await usuarioService.registrarEstadosUsuarios(estadosUsuarios);
        await problemaService.registrarEstadosProblemas(estadosProblemas);

        //se procesan los logros de estado global con el checkpoint del bloque para evitar reevaluar
        await logrosService.cargarTrofeos(usuarios, estadosUsuarios, estadosProblemas, checkpointsLogro, lastEnvioId);

        //se procesan los xp obtenidos por cada usuario a partir de los envios y los logros obtenidos
        //await xpService.procesarBloqueEstados(estadosUsuariosIniciales, estadosUsuarios);

        //se avanzan los checkpoints en Redis de las stats y logros que quedaron por detras del bloque
        const checkpointsStat = new Map([...checkpointsUsuarios, ...checkpointsProblemas]);
        await checkpointsService.avanzarCheckpoints(checkpointsStat, checkpointsLogro, lastEnvioId);
    }

    /**
     * Actualiza los estados de usuarios y problemas aplicando los envios del bloque en orden.
     * Ademas se procesan los logros dependientes del estado del juez en un momento concreto.
     * @param enviosProcesados - Array de envios ya parseados al formato interno.
     * @param checkpoints - Checkpoints actuales de cada calculador y logro para filtrar los envios ya procesados por cada uno.
     * @returns - Estados de usuarios y problemas actualizados despues de aplicar el bloque.
     */
    private async actualizarEstados(
            enviosProcesados: EnvioProcesado[],
            checkpoints: Map<string, Map<string, number>>): Promise<{estadosUsuarios: Map<string, EstadoUsuario>, estadosProblemas: Map<string, EstadoProblema>}>
        {

        //se actualizan los estados aplicando solo los calculadores y logros cuyo checkpoint
        //sea menor que el envioId actual, los ya al dia se saltan ese envio
        let envio: EnvioProcesado = enviosProcesados[0];
        let estadosUsuarios: Map<string, EstadoUsuario> = new Map();
        let estadosProblemas: Map<string, EstadoProblema> = new Map();

        //ultimo envio que proceso cada calculador
        const checkpointsUsuarios = checkpoints.get("usuarios")!;
        const checkpointsProblemas = checkpoints.get("problemas")!;
        const checkpointsLogro = checkpoints.get("logros")!;

        for await ({ estadosUsuarios, estadosProblemas, envio } of estadosService.getEstadosActualizados(
            enviosProcesados,
            checkpointsUsuarios,
            checkpointsProblemas,
            estadosUsuarios,
            estadosProblemas
        )) {
            logrosService.procesarEstado(
                estadosUsuarios.get(envio.usuario) as EstadoUsuario,
                estadosProblemas.get(envio.problema) as EstadoProblema,
                envio,
                checkpointsLogro
            );
        }

        return { estadosUsuarios, estadosProblemas };
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
            hora: fecha.getUTCHours()
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
            hora: fecha.getUTCHours()
        };

        return envioProcesado;
    }
}

export default new ProcesarEnviosService();
