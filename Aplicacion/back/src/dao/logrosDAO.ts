import DAO from "./DAO.js";
import { datosLogro } from "../types/datos/datosLogro.js";
import { Pipeline } from "./DAO.js"

class LogrosDAO extends DAO {

    /**
     * Persiste los logros de varios usuarios usando un pipeline.
     * Actualiza el set de logros por usuario y el set de usuarios por logro.
     * @param datos - Array de objetos con usuario y logros a guardar.
     */
    async guardarBloqueLogros(datos: datosLogro[]): Promise<void> {
        const pipeline = this.redis.multi();
        for (const dato of datos) {
            if (dato.logros.length > 0) {
                pipeline.sAdd(`logros:${dato.usuario}`, dato.logros.map(String));
                for (const logro of dato.logros)
                    pipeline.sAdd(`usuarios:${logro}`, dato.usuario);
            }
        }
        await pipeline.exec();
    }

    /**
     * Persiste los 3 logros mas recientes de cada usuario usando un pipeline.
     * @param datos - Array de objetos con usuario y logros a guardar.
     */
    async guardarUltimosLogros(datos: datosLogro[]): Promise<void> {
        const pipeline = this.redis.multi();
        for (const dato of datos) {
            if (dato.logros.length > 0) {
                for (const logro of dato.logros)
                    pipeline.lPush(`logros:recientes:${dato.usuario}`, String(logro));
                pipeline.lTrim(`logros:recientes:${dato.usuario}`, 0, 2);
            }
        }
        await pipeline.exec();
    }

    /**
     * Encola en el pipeline el guardado de los logros que un usuario obtuvo en el mes indicado.
     * @param pipeline - Pipeline donde encolar el comando.
     * @param usuario - Identificador del usuario.
     * @param mes - Mes (0-11) al que pertenecen los logros.
     * @param ids - Ids de los logros obtenidos en ese mes.
     */
    public registrarLogrosUsuarioMes(pipeline: Pipeline, usuario: string, mes: number, ids: number[]): void {
        pipeline.sAdd(`logros:${usuario}:mes:${mes}`, ids.map(String));
    }


    /**
     * Elimina un logro concreto del set de logros de cada usuario en Redis,
     * tanto del set global como de los sets por mes.
     * Se usa al recalcular un logro cuya version cambio: se quita de todos los usuarios
     * para que se reevalue su condicion durante el reproceso de envios.
     * @param logro - Id del logro a eliminar.
     */
    public async borrarLogro(logro: number): Promise<void> {
        const usuarios = await this.redis.sMembers(`usuarios:${logro}`);
        const pipeline = this.redis.multi();
        for (const usuario of usuarios) {
            pipeline.sRem(`logros:${usuario}`, String(logro)); //TODO aqui
            pipeline.lRem(`logros:recientes:${usuario}`, 0, String(logro));
            //tambien se quita el logro de cada set por mes del usuario
            for await (const claves of this.redis.scanIterator({ MATCH: `logros:${usuario}:mes:*`, COUNT: 100 }))
                for (const clave of claves)
                    pipeline.sRem(clave, String(logro));
        }
        pipeline.del(`usuarios:${logro}`);
        await pipeline.exec();
    }

    /**
     * Devuelve los ids de los logros obtenidos por cada usuario en el mes indicado.
     * @param mes - Mes (0-11) a consultar.
     * @returns Mapa de usuario al conjunto de ids de logros obtenidos en ese mes.
     */
    public async getLogrosMes(mes: number): Promise<Map<string, Set<number>>> {
        const resultado = new Map<string, Set<number>>();
        for await (const claves of this.redis.scanIterator({ MATCH: `logros:*:mes:${mes}`, COUNT: 100 })) {
            for (const clave of claves) {
                const usuario = clave.split(':')[1];
                const ids = await this.redis.sMembers(clave);
                if (ids.length > 0) resultado.set(usuario, new Set((ids.map(Number))));
            }
        }
        return resultado;
    }

    //============================== CONSULTAS ==============================

    /**
     * Devuelve los ids de los logros obtenidos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array con los ids de los logros.
     */
    async getLogros(usuario: string): Promise<number[]> {
        const ids = await this.redis.sMembers(`logros:${usuario}`);
        return ids.map(Number);
    }

    /**
     * Devuelve los ids de los 3 logros mas recientes del usuario en orden de obtencion.
     * @param usuario - Identificador del usuario.
     * @returns Array con los ids de los logros recientes.
     */
    async getUltimosLogros(usuario: string): Promise<number[]> {
        const ids = await this.redis.lRange(`logros:recientes:${usuario}`, 0, 2);
        return ids.map(Number);
    }
}

export default new LogrosDAO();
