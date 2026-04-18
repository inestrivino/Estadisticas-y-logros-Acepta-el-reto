import DAO from "./DAO.js";
import { datosLogro } from "../types/datosLogro.js";

class LogrosDAO extends DAO {

    async registrarDirecto(_dato: any): Promise<void> {}
    async agregarAlPipeline(_dato: any, _pipeline: any): Promise<void> {}

    async getLogros(usuario: string): Promise<string[]> {
        return await this.redis.sMembers(`usuario:${usuario}:logros`);
    }

    async guardarLogros(dato: datosLogro): Promise<void> {
        if (dato.logros.length === 0) return;
        await this.redis.sAdd(`usuario:${dato.usuario}:logros`, dato.logros);
    }

    async guardarBloqueLogros(datos: datosLogro[]): Promise<void> {
        const pipeline = this.redis.multi();
        for (const dato of datos)
            if (dato.logros.length > 0)
                pipeline.sAdd(`usuario:${dato.usuario}:logros`, dato.logros);
        await pipeline.exec();
    }
}

export default new LogrosDAO();
