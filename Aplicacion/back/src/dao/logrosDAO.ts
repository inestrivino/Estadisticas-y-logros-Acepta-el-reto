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
                pipeline.sAdd(`logros:${dato.usuario}`, dato.logros);
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
                    pipeline.lPush(`logros:recientes:${dato.usuario}`, logro);
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
     * @param nombres - Nombres de los logros obtenidos en ese mes.
     */
    public registrarLogrosUsuarioMes(pipeline: Pipeline, usuario: string, mes: number, nombres: string[]): void {
        pipeline.sAdd(`logros:${usuario}:mes:${mes}`, nombres);
    }


    /**
     * Elimina un logro concreto del set de logros de cada usuario en Redis,
     * tanto del set global como de los sets por mes.
     * Se usa al recalcular un logro cuya version cambio: se quita de todos los usuarios
     * para que se reevalue su condicion durante el reproceso de envios.
     * @param logro - Nombre del logro a eliminar.
     */
    public async borrarLogro(logro: string): Promise<void> {
        const usuarios = await this.redis.sMembers(`usuarios:${logro}`);
        const pipeline = this.redis.multi();
        for (const usuario of usuarios) {
            pipeline.sRem(`logros:${usuario}`, logro);
            pipeline.lRem(`logros:recientes:${usuario}`, 0, logro);
            //tambien se quita el logro de cada set por mes del usuario
            for await (const claves of this.redis.scanIterator({ MATCH: `logros:${usuario}:mes:*`, COUNT: 100 }))
                for (const clave of claves)
                    pipeline.sRem(clave, logro);
        }
        pipeline.del(`usuarios:${logro}`);
        await pipeline.exec();
    }

    //============================== CONSULTAS ==============================

    /**
     * Devuelve los nombres de los logros obtenidos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array con los nombres de los logros.
     */
    async getLogros(usuario: string): Promise<string[]> {
        return await this.redis.sMembers(`logros:${usuario}`);
    }

    /**
     * Devuelve los nombres de los 3 logros mas recientes del usuario en orden de obtencion.
     * @param usuario - Identificador del usuario.
     * @returns Array con los nombres de los logros recientes.
     */
    async getUltimosLogros(usuario: string): Promise<string[]> {
        return await this.redis.lRange(`logros:recientes:${usuario}`, 0, 2);
    }
}

export default new LogrosDAO();
