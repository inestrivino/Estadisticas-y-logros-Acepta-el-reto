import problemaService from "./problemaService.js";
import usuarioService from "./usuarioService.js";
import logrosService from "./logros/logrosService.js";
import { EnvioSinProcesar } from "../types/envioSinProcesar.js";
import { EnvioProcesado } from "../types/envioProcesado.js";
import gestionDAO from "../dao/gestionDAO.js";
import { conjuntoEmitter } from "../sockets/socketEmitter.js";

class ProcesarEnviosService {

    /**
     * Procesa y persiste un bloque de envios, calcula logros nuevos y notifica al frontend.
     * @param bloque - Array de envios sin procesar junto con su numero de pagina de origen.
     */
    public async procesarBloqueEnvios(bloque: { envio: EnvioSinProcesar, numPagina: number }[]) {

        //pongo cada envio del bloque con el formato correcto
        const enviosProcesados: EnvioProcesado[] = [];
        for (const data of bloque) {
            enviosProcesados.push(this.parseEnvio(data.envio));
        }

        //conjunto de problemas y usuarios que se han modificado para luego recargar el front
        const problemas: Set<string> = new Set<string>();
        const usuarios: Set<string> = new Set<string>();
        for (const envio of enviosProcesados) {
            usuarios.add(envio.usuario);
            problemas.add(envio.problema);
        }

        await logrosService.procesarBloqueEnvios(enviosProcesados);
        await this.cargarEnvios(enviosProcesados);

        //marca cual es ahora el ultimo envio procesado y la ultima pagina donde estaba
        await gestionDAO.setUltimoEnvio(enviosProcesados[enviosProcesados.length - 1].envioId);
        await gestionDAO.setUltimaPagina(bloque[bloque.length - 1].numPagina);
        console.log(" + Bloque insertado en la base de datos\n");

        //saca cuanto porcentaje lleva procesado y lo persiste
        const primeraPagina = await gestionDAO.getPrimeraPagina();
        const porcentaje = Math.round((primeraPagina - bloque[bloque.length - 1].numPagina) / primeraPagina * 100);
        await gestionDAO.setPorcentajeCarga(porcentaje);

        //avisa a los diagramas para que se actualicen
        conjuntoEmitter(problemas, usuarios, porcentaje);
    }

    /**
     * Procesa y persiste un unico envio recibido en tiempo real.
     * @param envio - Envio sin procesar recibido desde el consumer.
     */
    public async procesarEnvio(envio: EnvioSinProcesar) {
        const envioProcesado = this.parseEnvio(envio);

        await logrosService.procesarBloqueEnvios([envioProcesado]);
        await this.cargarEnvios([envioProcesado]);
    }

    /**
     * Convierte un envio en el formato crudo de la API al formato interno procesado.
     * @param envio - Envio en formato sin procesar.
     * @returns Envio transformado al formato interno.
     */
    private parseEnvio(envio: EnvioSinProcesar): EnvioProcesado {

        //si el envio no tiene usuario se pone este por defecto
        if (!envio.user)
            envio.user = { id: 0, name: "N0USER173", nick: "N0USER173", avatar: "https://aceptaelreto.com/pub/user/noavatar.jpg" };

        if (!envio.submissionDate)
            console.log("aaa");

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

    private async cargarEnvios(envios: EnvioProcesado[]) {
        await problemaService.registrarBloqueEnvios(envios);
        await usuarioService.registrarBloqueEnvios(envios);
    }
}

export default new ProcesarEnviosService();
