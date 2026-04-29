import problemaDAO from '../dao/problemaDAO.js';
import { EnvioProcesado } from '../types/envioProcesado.js';

class ProblemaService {

    /**
     * Persiste un bloque de envios en el DAO del problema.
     * @param envios - Array de envios en formato procesado.
     */
    public async registrarBloqueEnvios(envios: EnvioProcesado[]) {
        await problemaDAO.registrarBloqueEnvios(
            envios.map(envio => ({
                envioId: envio.envioId,
                problema: envio.problema,
                resultado: envio.resultado,
                lenguaje: envio.lenguaje,
                tiempo: envio.tiempo
            }))
        );
    }

    /**
     * Devuelve si el problema existe en la bd o no.
     * @param problema - Identificador del problema.
     */
    public async existeProblema(problema: string): Promise<boolean> {
        return await problemaDAO.existeProblema(problema);
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
}

export default new ProblemaService();
