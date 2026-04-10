import { EstadoUsuario } from "../estado/EstadoUsuario.js";
import EstadoServicio from "../estado/EstadoServicio.js";
import { logros } from "./Logros.js";
import { Logro } from "../../types/logro.js";
import UsuarioDAO from "../../dao/usuarioDAO.js";
import redisClient from "../../redis/redisClient.js";
import { EnvioProcesado } from "../../types/envio.js";

const usuarioDAO = new UsuarioDAO();

class ServicioLogro {

    async calcularYGuardarLogros() {
        const estados = EstadoServicio.getEstadosUsuarios();
        const pipeline = redisClient.multi();

        for (const [usuario, estado] of estados) {
            await this.cargarDatosAEstado(usuario, estado);
            const logros = this.procesarLogrosCargaInicial(estado);
            usuarioDAO.guardarLogros(usuario, logros, pipeline)
            this.persistirEstado(usuario, estado, pipeline);
        }
        await pipeline.exec();
    }

    procesarLogrosCargaInicial(usuario: EstadoUsuario): string[] {
        
        for (const logro of logros) {
            if (logro.condicionCargaInicial(usuario)) {
                usuario.logros.add(logro.nombre);
                usuario.logros.add(logro.nombre);
            }
        }

        return Array.from(usuario.logros);
    }

    async procesarLogrosTiempoReal(envio: EnvioProcesado): Promise<string[]> {
        const nuevos: string[] = [];
        const logrosUsuario = new Set(await usuarioDAO.getLogros(envio.usuario));
        const logrosFiltrados = this.filtrarPorTrigger(envio.resultado);

        for (const logro of logrosFiltrados) {
            if (!logrosUsuario.has(logro.nombre)) {
                if (await logro.condicion(envio)) {
                    nuevos.push(logro.nombre);
                }
            }
        }
        //TODO mirar otra manera de hacer lo del logro de "conseguir 5 logros"
        //TODO recordar cambiar el nombre de logro3 al nombre definitivo
        if (!logrosUsuario.has("logro3")) {
            if (nuevos.length + logrosUsuario.size >= 5) {
                nuevos.push("logro3")
            }
        }

        return nuevos;
    }

    //TODO comprobar que estos sean los unicos necesarios
    private persistirEstado(usuario: string, estado: EstadoUsuario, pipeline: any) {
        const rachaDiasEnvioMax = estado.rachaDiasEnvioMax ? estado.rachaDiasEnvioMax : 0;
        pipeline.set(`usuario${usuario}:rachaDiasEnvioMax`, rachaDiasEnvioMax);

        const rachaEnviosACMax = estado.rachaEnviosACMax ? estado.rachaEnviosACMax : 0;
        pipeline.set(`usuario${usuario}:rachaEnviosACMax`, rachaEnviosACMax);
    }

    private async cargarDatosAEstado(usuario: string, estado: EstadoUsuario) {
        estado.numProblemasResueltos = await usuarioDAO.getNumProblemasResueltos(usuario);

        const numProblemasResuletosC = await usuarioDAO.getNumProblemasLenguaje(usuario, "c");
        estado.lenguajesProblemasResueltos.set("c", numProblemasResuletosC);
        const numProblemasResuletosCpp = await usuarioDAO.getNumProblemasLenguaje(usuario, "cpp");
        estado.lenguajesProblemasResueltos.set("cpp", numProblemasResuletosCpp);
        const numProblemasResuletosJava = await usuarioDAO.getNumProblemasLenguaje(usuario, "java");
        estado.lenguajesProblemasResueltos.set("java", numProblemasResuletosJava);
    }

    private filtrarPorTrigger(resultado: string): Logro[] {
        if (resultado !== "AC") {
            return logros.filter(l => l.trigger === "siempre");
        }
        return logros;
    }

}

export default new ServicioLogro();