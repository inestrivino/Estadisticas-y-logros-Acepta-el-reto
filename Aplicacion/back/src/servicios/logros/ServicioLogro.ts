import { EstadoUsuario } from "../estado/EstadoUsuario.js";
import EstadoServicio from "../estado/EstadoServicio.js";
import {logros, Logro} from "./listadoLogros.js";
import UsuarioDAO from "src/dao/usuarioDAO.js";
import redisClient from "src/redis/redisClient.js";


class ServicioLogro {

    async calcularYGuardarLogros() {
        const estados = EstadoServicio.getEstados();
        const pipeline = redisClient.multi();

        const usuarioDAO = new UsuarioDAO();
        for(const [usuario, estado] of estados) {
            const logros = this.logrosNuevos(estado);
            usuarioDAO.guardarLogros(usuario, logros, pipeline)
        }
        await pipeline.exec();
    }
    
    logrosNuevos(usuario: EstadoUsuario): string[] {
        const nuevos: string[] = [];

        for(const logro of logros) {
            if(logro.condicion(usuario)) {
                nuevos.push(logro.nombre);
                usuario.logros.add(logro.nombre);
            }
        }

        return nuevos;
    }
    /*
    private filtrarPorTrigger(envio: any): Logro[] {
        if(envio.resultado !== "AC") {
            return logros.filter(l => l.trigger === "envio");
        }
        return logros;
    }
    */
}

export default new ServicioLogro();