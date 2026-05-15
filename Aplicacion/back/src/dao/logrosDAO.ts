import DAO from "./DAO.js";
import { datosLogro } from "../types/datos/datosLogro.js";

class LogrosDAO extends DAO {
    
    /**
     * Persiste los logros de varios usuarios usando un pipeline.
     * @param datos - Array de objetos con usuario y logros a guardar.
     */
    /**
     * Persiste los logros de varios usuarios usando un pipeline.
     * Actualiza tanto el set de logros por usuario como el set de usuarios por logro.
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
     * Persiste los logros de varios usuarios en el mes indicado usando un pipeline.
     * @param datos - Array de objetos con usuario y logros a guardar.
     * @param mes - Mes (0-11) al que pertenecen los logros.
     */
    async guardarBloqueLogrosMes(datos: datosLogro[], mes: number): Promise<void> {
        const pipeline = this.redis.multi();
        for (const dato of datos)
            if (dato.logros.length > 0)
                pipeline.sAdd(`logros:${dato.usuario}:mes:${mes}`, dato.logros);
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
     * Elimina un logro concreto del set de logros de cada usuario en Redis.
     * Se usa al recalcular un logro cuya version cambio: se quita de todos los usuarios
     * para que se reevalue su condicion durante el reproceso de envios.
     * @param logro - Nombre del logro a eliminar.
     */
    public async borrarLogro(logro: string): Promise<void> {
        const usuarios = await this.redis.sMembers(`usuarios:${logro}`);
        const pipeline = this.redis.multi();
        for (const usuario of usuarios)
            pipeline.sRem(`logros:${usuario}`, logro);
        pipeline.del(`usuarios:${logro}`);
        await pipeline.exec();
    }
}

export default new LogrosDAO();
