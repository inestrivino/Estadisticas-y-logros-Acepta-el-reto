import problemaService from "./problemas/problemaService.js";
import usuarioService from "./usuarios/usuarioService.js";
import { EstadoUsuario } from "../types/estadoUsuario.js";
import { EstadoProblema } from "../types/estadoProblema.js";
import logrosService from "./logros/logrosService.js";
import { EnvioSinProcesarInicial } from "../types/envioSinProcesarInicial.js";
import { EnvioSinProcesarEvent } from "../types/envioSinProcesarEvent.js";
import { EnvioProcesado } from "../types/envioProcesado.js";
import { conjuntoEmitter, routerEmitter } from "../sockets/socketEmitter.js";
import xpService from "./xpService.js";
import estadosService from "./estados/estadosService.js";
import gestionService from "./gestionService.js";

class ProcesarEnviosService {

    /**
     * Parsea, procesa y persiste un bloque de envios de carga historica.
     * Actualiza el progreso de carga (ultimo envio, pagina y porcentaje) y notifica al frontend.
     * @param bloque - Array de envios sin procesar junto con su numero de pagina de origen.
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
     * Calcula logros y XP, y persiste las estadisticas de un bloque de envios ya procesados.
     * @param enviosProcesados - Array de envios en formato interno.
     * @param usuarios - Conjunto de identificadores de usuario presentes en el bloque.
     * @param problemas - Conjunto de identificadores de problema presentes en el bloque.
     */
    private async procesarBloqueEnvios(enviosProcesados: EnvioProcesado[], usuarios: Set<string>, problemas: Set<string>) {

        //de los estados que van a cambiar se saca el estado actual de la base de datos
        const {estadosUsuariosIniciales, estadosProblemasIniciales} = await estadosService.getEstadosIniciales(usuarios, problemas);

        //se actualizan los estados de los usuarios y problemas de este bloque.
        //se procesa cada estado despues de cada envio para procesar los trofeos que dependen del estado de las estadisticas
        //en un momento concreto (ejemplo: rachas, tiempos relativos a los de otros usuario etc)
        let envio: EnvioProcesado;
        let estadosUsuarios: Map<string, EstadoUsuario> = estadosUsuariosIniciales;
        let estadosProblemas: Map<string, EstadoProblema> = estadosProblemasIniciales;
        for await ({ estadosUsuarios, estadosProblemas, envio } of estadosService.getEstadosActualizados(enviosProcesados)) {
            logrosService.procesarEstado(
                estadosUsuarios.get(envio.usuario) as EstadoUsuario, 
                estadosProblemas!.get(envio.problema) as EstadoProblema, 
                envio
            );
        }

        //se procesan los trofeos que no dependen de estadisticas de un momento concreto
        //(ejemplo: trofeos por resolver cantidades de problemas, por usar lenguajes etc)
        //y se guardan todos los trofeos en la base de datos
        await logrosService.cargarTrofeos(usuarios, estadosUsuarios, estadosProblemas);

        //se procesan los xp obtenidos por cada usuario a partir de los envios y los logros obtenidos
        await xpService.procesarBloqueEstados(estadosUsuariosIniciales, estadosUsuarios);

        //se persisten los estados de usuarios y problemas resultantes del bloque
        await usuarioService.registrarEstadosUsuarios(estadosUsuarios);
        await problemaService.registrarEstadosProblemas(estadosProblemas);
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
            usuario: envio.user.nick,
            problema: envio.problem.title,
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
            usuario: envio.nick,
            problema: problema.title,
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
