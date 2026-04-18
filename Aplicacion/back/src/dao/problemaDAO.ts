import DAO from "./DAO.js"
import redisClient from '../redis/redisClient.js';
import { datosProblema } from "../types/datosProblema.js";

class ProblemaDAO extends DAO {

    /**
     * Registra en Redis un bloque de envios usando un pipeline para minimizar el numero de llamadas.
     * @param envios - Array de datos de envios a registrar.
     */
    public async registrarBloqueEnvios(envios: datosProblema[]): Promise<void> {
        const pipeline = this.redis.multi();
        for (const envio of envios) {
            pipeline.incr(`problema:${envio.problema}:envios`);
            pipeline.hIncrBy(`problema:${envio.problema}:resultados`, envio.resultado, 1);
            pipeline.hIncrBy(`problema:${envio.problema}:lenguajes`, envio.lenguaje, 1);

            if (envio.resultado === "AC") {
                pipeline.incr(`problema:${envio.problema}:enviosAC`);
                pipeline.incrByFloat(`problema:${envio.problema}:tiempoTotal`, envio.tiempo);
                pipeline.zAdd(`problema:${envio.problema}:tiemposEnvios`, { score: envio.tiempo, value: String(envio.envioId) });
            }
        }
        await pipeline.exec();
    }

    /**
     * Devuelve el numero total de envios del problema, o 0 si no hay ninguno.
     * @param problema - Identificador del problema.
     * @returns Numero de envios.
     */
    async getNumEnvios(problema: string): Promise<number> {
        const numEnvios = await this.redis.get(`problema:${problema}:envios`);
        return numEnvios ? Number(numEnvios) : 0;
    }

    /**
     * Devuelve el mejor tiempo de ejecucion registrado para el problema, o 0 si no hay ninguno.
     * @param problema - Identificador del problema.
     * @returns Mejor tiempo en milisegundos.
     */
    async getMejorTiempo(problema: string): Promise<number> {
        //const mejorTiempo = await this.redis.get(`problema:${problema}:mejorTiempo`);
        const aux = await this.redis.zRangeWithScores(`problema:${problema}:tiemposEnvios`, 0, 0);
        if (aux.length === 0)
            return 0;
        const mejorTiempo = aux[0].score;
        return mejorTiempo ? Number(mejorTiempo) : 0;
    }

    /**
     * Devuelve el tiempo de ejecucion promedio de los envios correctos, o 0 si no hay ninguno.
     * @param problema - Identificador del problema.
     * @returns Tiempo promedio en milisegundos.
     */
    async getTiempoPromedio(problema: string): Promise<number> {
        const numAciertos = await this.redis.hGet(`problema:${problema}:resultados`, 'AC');
        const tiempoTotal = await this.redis.get(`problema:${problema}:tiempoTotal`);

        const numAciertosNum = numAciertos ? Number(numAciertos) : 0;
        const tiempoTotalNum = tiempoTotal ? Number(tiempoTotal) : 0;

        return numAciertosNum > 0 ? tiempoTotalNum / numAciertosNum : 0;
    }

    /**
     * Devuelve el conteo de cada resultado del problema ordenado alfabeticamente.
     * @param problema - Identificador del problema.
     * @returns Array de pares `{ name, value }` ordenado por nombre.
     */
    async getResultados(problema: string): Promise<{ name: string, value: number }[]> {
        const datos = await this.redis.hGetAll(`problema:${problema}:resultados`);

        const formateados: { name: string, value: number }[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({ name: aux[0], value: Number(aux[1]) })

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    /**
     * Devuelve el conteo de envios por lenguaje del problema ordenado alfabeticamente.
     * @param problema - Identificador del problema.
     * @returns Array de pares `{ name, value }` ordenado por nombre.
     */
    async getLenguajes(problema: string): Promise<{ name: string, value: number }[]> {
        const datos = await this.redis.hGetAll(`problema:${problema}:lenguajes`);

        const formateados: { name: string, value: number }[] = [];
        for (const aux of Object.entries(datos))
            formateados.push({ name: aux[0], value: Number(aux[1]) })

        formateados.sort((a, b) => a.name.localeCompare(b.name));

        return formateados;
    }

    /**
     * Devuelve el numero de envios con resultado AC del problema, o 0 si no hay ninguno.
     * @param problema - Identificador del problema.
     * @returns Numero de envios correctos.
     */
    async getNumEnviosAC(problema: string): Promise<number> {
        const numEnviosAC = await this.redis.get(`problema:${problema}:enviosAC`);
        return numEnviosAC ? Number(numEnviosAC) : 0;
    }

    /**
     * Devuelve la posicion del envio en el ranking de tiempos del problema, o -1 si no existe.
     * @param problema - Identificador del problema.
     * @param envioId - Id del envio cuya posicion se quiere consultar.
     * @returns Posicion en el ranking (0-indexed), o -1 si no se encuentra.
     */
    async getRankEnvioProblema(problema: string, envioId: number): Promise<number> {
        const pos = await this.redis.zRank(`problema:${problema}:tiemposEnvios`, String(envioId));
        return pos !== null ? Number(pos) : -1;
    }
}

export default new ProblemaDAO();