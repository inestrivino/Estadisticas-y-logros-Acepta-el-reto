import usuarioDAO from "../dao/usuarioDAO.js";
import problemaDAO from "../dao/problemaDAO.js";
import logrosService from "./logros/logrosService.js";
import { EnvioSinProcesar } from "../types/envioSinProcesar.js";
import { EnvioProcesado } from "../types/envioProcesado.js";
import gestionDAO from "../dao/gestionDAO.js";
import logrosDAO from "../dao/logrosDAO.js";
import { conjuntoEmitter } from "../sockets/socketEmitter.js";

class ProcesarEnviosService {

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
        
        //le pide a logrosService los logros que se han conseguido con este bloque de envios
        const nuevosPorUsuario = await logrosService.procesarBloqueEnvios(enviosProcesados);

        await this.cargarBloqueEnvios(enviosProcesados);

        //guarda en Redis los logros nuevos conseguidos en este bloque
        await logrosDAO.guardarBloqueLogros(nuevosPorUsuario);

        //avisa a los diagramas para que se actualicen
        conjuntoEmitter(problemas, usuarios);

        //marca cual es ahora el ultimo envio procesado y la ultima pagina donde estaba
        await gestionDAO.setUltimoEnvio(enviosProcesados[enviosProcesados.length - 1].envioId);
        await gestionDAO.setUltimaPagina(bloque[bloque.length - 1].numPagina);
        console.log(" + Bloque insertado en la base de datos\n");
    }

    public async procesarEnvio(envio: EnvioSinProcesar) {
        console.log("Carga un envio individual");
        const envioProcesado = this.parseEnvio(envio);
        await this.cargarEnvio(envioProcesado, undefined);
    }

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

    private async cargarBloqueEnvios(envios: EnvioProcesado[]) {

        //actualiza la informacion del problema
        await problemaDAO.registrarBloqueEnvios(
            envios.map(envio => ({
                envioId: envio.envioId,
                problema: envio.problema,
                resultado: envio.resultado,
                lenguaje: envio.lenguaje,
                tiempo: envio.tiempo
            }))
        );

        //actualiza la informacion del usuario
        //TODO poner aqui tambien el pipeline
        await usuarioDAO.registrarBloqueEnvios(
            envios.map(envio => ({
                envioId: envio.envioId,
                usuario: envio.usuario,
                problema: envio.problema,
                categoria: "", //TODO categorias problemas
                resultado: envio.resultado,
                lenguaje: envio.lenguaje,
                fecha: envio.fecha
            }))
        );
    }

    private async cargarEnvio(envio: EnvioProcesado, pipeline?: any) {

        //actualiza la informacion del problema
        await problemaDAO.registrarDato(
            {
                envioId: envio.envioId,
                problema: envio.problema,
                resultado: envio.resultado,
                lenguaje: envio.lenguaje,
                tiempo: envio.tiempo
            },
            pipeline,
        );

        //actualiza la informacion del usuario
        //TODO poner aqui tambien el pipeline
        await usuarioDAO.registrarDato(
            {
                envioId: envio.envioId,
                usuario: envio.usuario,
                problema: envio.problema,
                //categoria: envio.categoria, //TODO categorias problemas
                resultado: envio.resultado,
                lenguaje: envio.lenguaje,
                fecha: envio.fecha
            },
            pipeline
        );

    }
}

export default new ProcesarEnviosService();
