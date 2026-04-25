import problemaService from "./problemaService.js";
import usuarioService from "./usuarioService.js";
import logrosService from "./logros/logrosService.js";
import { EnvioSinProcesarInicial } from "../types/envioSinProcesarInicial.js";
import { EnvioSinProcesarEvent } from "../types/envioSinProcesarEvent.js";
import { EnvioProcesado } from "../types/envioProcesado.js";
import gestionDAO from "../dao/gestionDAO.js";
import { conjuntoEmitter, routerEmitter } from "../sockets/socketEmitter.js";
import xpService from "./xpService.js";

class ProcesarEnviosService {

    /**
     * Procesa y persiste un bloque de envios, calcula logros nuevos y notifica al frontend.
     * @param bloque - Array de envios sin procesar junto con su numero de pagina de origen.
     */
    public async procesarBloqueEnvios(bloque: { envio: EnvioSinProcesarInicial, numPagina: number }[]) {

        //cada elemento del bloque se parsea
        const enviosProcesados = bloque.map(e => this.parseEnvioInicial(e.envio));

        //conjunto de problemas y usuarios que se han modificado para luego recargar el front
        const problemas: Set<string> = new Set<string>();
        const usuarios: Set<string> = new Set<string>();
        for (const envio of enviosProcesados) {
            usuarios.add(envio.usuario);
            problemas.add(envio.problema);
        }

        //actualiza la informacion
        const nuevosLogros = await logrosService.procesarBloqueEnvios(enviosProcesados);
        const actualizacionesRanking = await xpService.procesarBloqueEnvios(enviosProcesados, nuevosLogros);
        await problemaService.registrarBloqueEnvios(enviosProcesados);
        await usuarioService.registrarBloqueEnvios(enviosProcesados);

        //marca cual es ahora el ultimo envio procesado y la ultima pagina donde estaba
        await gestionDAO.setUltimoEnvio(enviosProcesados[enviosProcesados.length - 1].envioId);
        await gestionDAO.setUltimaPagina(bloque[bloque.length - 1].numPagina);
        console.log(" + Bloque insertado en la base de datos\n");

        //saca cuanto porcentaje lleva procesado y lo persiste
        const primeraPagina = await gestionDAO.getPrimeraPagina();
        const porcentaje = Math.round((primeraPagina - bloque[bloque.length - 1].numPagina) / primeraPagina * 100);
        await gestionDAO.setPorcentajeCarga(porcentaje);

        //avisa a los diagramas para que se actualicen
        conjuntoEmitter(problemas, usuarios, porcentaje, actualizacionesRanking);
    }

    /**
     * Procesa y persiste un bloque de envios recibidos en tiempo real.
     * @param bloque - Array de envios sin procesar recibidos desde el consumer.
     */
    public async procesarBloqueEnviosEvent(bloque: EnvioSinProcesarEvent[]) {
        //cada elemento del bloque se parsea
        const enviosProcesados = bloque.map(e => this.parseEnvioEvent(e));

        //actualiza la informacion
        const nuevosLogros = await logrosService.procesarBloqueEnvios(enviosProcesados);
        const actualizacionesRanking = await xpService.procesarBloqueEnvios(enviosProcesados, nuevosLogros);
        await problemaService.registrarBloqueEnvios(enviosProcesados);
        await usuarioService.registrarBloqueEnvios(enviosProcesados);

        //TODO falta poner como se actualiza el ranking con el socket
        //avisa a los diagramas para que se actualicen
        for (const envioProcesado of enviosProcesados)
            routerEmitter(envioProcesado);
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
            fecha: envio.submissionDate / 1000,
            hora: fecha.getHours()
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
            fecha: envio.sbt,
            hora: fecha.getHours()
        };

        return envioProcesado;
    }
}

export default new ProcesarEnviosService();
