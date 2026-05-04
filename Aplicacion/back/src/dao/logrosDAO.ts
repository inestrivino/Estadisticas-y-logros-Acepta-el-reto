import DAO from "./DAO.js";
import { datosLogro } from "../types/datosLogro.js";

class LogrosDAO extends DAO {
    
    /**
     * Persiste los logros de varios usuarios usando un pipeline.
     * @param datos - Array de objetos con usuario y logros a guardar.
     */
    async guardarBloqueLogros(datos: datosLogro[]): Promise<void> {
        const pipeline = this.redis.multi();
        for (const dato of datos)
            if (dato.logros.length > 0)
                pipeline.sAdd(`usuario:${dato.usuario.toLowerCase().normalize("NFC").trim()}:logros`, dato.logros);
        await pipeline.exec();
    }

    /**
     * Devuelve los nombres de los logros obtenidos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array con los nombres de los logros.
     */
    async getLogros(usuario: string): Promise<string[]> {
        return await this.redis.sMembers(`usuario:${usuario}:logros`);
    }
}

export default new LogrosDAO();
