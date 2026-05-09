import DAO from "./DAO.js";
import { datosLogro } from "../types/datos/datosLogro.js";

class LogrosDAO extends DAO {
    
    /**
     * Persiste los logros de varios usuarios usando un pipeline.
     * @param datos - Array de objetos con usuario y logros a guardar.
     */
    async guardarBloqueLogros(datos: datosLogro[]): Promise<void> {
        const pipeline = this.redis.multi();
        for (const dato of datos)
            if (dato.logros.length > 0)
                pipeline.sAdd(`logros:${dato.usuario}`, dato.logros);
        await pipeline.exec();
    }

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
        const pipeline = this.redis.multi();
        for await (const keys of this.redis.scanIterator({ MATCH: 'logros:*', COUNT: 100 }))
            for (const key of keys)
                pipeline.sRem(key, logro);
        await pipeline.exec();
    }

    /**
     * Elimina de Redis todas las claves gestionadas por este DAO.
     */
    public async borrarTodo(): Promise<void> {
        const pipeline = this.redis.multi();

        for await (const keys of this.redis.scanIterator({ MATCH: 'logros:*', COUNT: 100 }))
            if (keys.length > 0) pipeline.del(keys);

        await pipeline.exec();
    }
}

export default new LogrosDAO();
