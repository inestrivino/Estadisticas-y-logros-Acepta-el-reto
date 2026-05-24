import problemaDAO from '../dao/problemaDAO.js';
import { EstadoProblema } from '../types/estados/estadoProblema.js';
import { RegistradorProblema } from './registradores/problemaRegistrador.js';
import registradorEnvios from './registradores/problemas/enviosRegistrador.js';
import registradorTiempos from './registradores/problemas/tiemposRegistrador.js';
import registradorResultados from './registradores/problemas/resultadosRegistrador.js';
import registradorLenguajes from './registradores/problemas/lenguajesRegistrador.js';

class ProblemaService {

    //para añadir un nuevo campo basta con crear un nuevo registrador y añadirlo aqui
    private registradores: RegistradorProblema[] = [
        registradorEnvios,
        registradorTiempos,
        registradorResultados,
        registradorLenguajes,
    ];

    /**
     * Persiste en Redis el estado completo de cada problema del mapa usando un pipeline.
     * Solo se escriben los campos definidos en el estado (los `undefined` se omiten).
     * @param estadosProblemas - Mapa de identificador de problema a su estado final.
     */
    public async registrarEstadosProblemas(estadosProblemas: Map<string, EstadoProblema>): Promise<void> {
        const pipeline = problemaDAO.iniciarPipeline();

        for (const [problema, estado] of estadosProblemas) {
            for (const { id, registrar } of this.registradores)
                if (estado[id] !== undefined)
                    registrar(pipeline, problema, estado);

            problemaDAO.guardarProblema(pipeline, problema);
        }

        await pipeline.exec();
    }

    /**
     * Borra los campos de los registradores indicados para cada problema.
     * @param ids - Conjunto de ids de registradores cuyos campos hay que borrar.
     */
    public async resetearCamposProblemas(ids: Set<string>): Promise<void> {

        const problemas: string[] = await problemaDAO.getTodosProblemas();

        for (const registrador of this.registradores)
            if (ids.has(registrador.id))
                await registrador.borrar(problemas);
    }

    //============================== CONSULTAS ==============================

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
