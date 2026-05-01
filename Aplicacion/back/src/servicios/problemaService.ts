import problemaDAO from '../dao/problemaDAO.js';
import { EnvioProcesado } from '../types/envioProcesado.js';
import { EstadoProblema } from '../types/estadoProblema.js';

class ProblemaService {

    /**
     * Persiste el estado final de un bloque de problemas en Redis.
     * @param estadosProblemas - Mapa de identificador de problema a su estado final.
     */
    public async registrarEstadosProblemas(estadosProblemas: Map<string, EstadoProblema>) {
        return await problemaDAO.registrarEstadosProblemas(estadosProblemas);
    }

    /**
     * Devuelve si el problema existe en la bd o no.
     * @param problema - Identificador del problema.
     */
    public async existeProblema(problema: string): Promise<boolean> {
        const p = problema.toLowerCase().normalize("NFC").trim();
        return await problemaDAO.existeProblema(p);
    }

    public async getProblemasSugeridos(patron: string): Promise<string[]> {
        const p = patron.toLowerCase().normalize("NFC").trim();
        return problemaDAO.getProblemasSugeridos(p);
    }

    /**
     * Devuelve el numero total de envios del problema.
     * @param problema - Identificador del problema.
     */
    public async getNumEnvios(problema: string) {
        return await problemaDAO.getNumEnvios(problema);
    }

    /**
     * Devuelve el mejor tiempo de ejecucion registrado para el problema.
     * @param problema - Identificador del problema.
     */
    public async getMejorTiempo(problema: string) {
        return await problemaDAO.getMejorTiempo(problema);
    }

    /**
     * Devuelve el tiempo de ejecucion promedio de los envios correctos del problema.
     * @param problema - Identificador del problema.
     */
    public async getTiempoPromedio(problema: string) {
        return await problemaDAO.getTiempoPromedio(problema);
    }

    /**
     * Devuelve el conteo de cada resultado del problema ordenado alfabeticamente.
     * @param problema - Identificador del problema.
     * @returns Array de pares `{ name, value }`.
     */
    public async getResultados(problema: string) {
        return await problemaDAO.getResultados(problema);
    }

    /**
     * Devuelve el conteo de envios por lenguaje del problema ordenado alfabeticamente.
     * @param problema - Identificador del problema.
     * @returns Array de pares `{ name, value }`.
     */
    public async getLenguajes(problema: string) {
        return await problemaDAO.getLenguajes(problema);
    }

    /**
     * Devuelve el numero total de envios correctos del problema.
     * @param problema - Identificador del problema.
     */
    public async getNumEnviosAC(problema: string) {
        return await problemaDAO.getNumEnviosAC(problema);
    }

    /**
     * Devuelve la suma de tiempos de ejecucion de los envios correctos del problema.
     * @param problema - Identificador del problema.
     */
    public async getTiempoTotal(problema: string) {
        return await problemaDAO.getTiempoTotal(problema);
    }

    /**
     * Devuelve el array de tiempos de envios correctos ordenado ascendentemente.
     * @param problema - Identificador del problema.
     */
    public async getTiemposOrdenados(problema: string) {
        return await problemaDAO.getTiemposOrdenados(problema);
    }
}

export default new ProblemaService();
