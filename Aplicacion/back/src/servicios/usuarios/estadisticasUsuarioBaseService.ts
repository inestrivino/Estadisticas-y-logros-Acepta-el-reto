import usuarioDAO from '../../dao/usuarioDAO.js';
import { EstadoUsuario } from '../../types/estadoUsuario.js';

class EstadisticasUsuarioBase {

    /**
     * Registra el estado de varios usuarios en base de datos.
     * @param estadosUsuarios - Mapa de nombre de usuario a su estado.
     */
    async registrarEstadosUsuarios(estadosUsuarios: Map<string, EstadoUsuario>): Promise<void> {
        await usuarioDAO.registrarEstadosUsuarios(estadosUsuarios);
    }

    /**
     * Devuelve los envios del ultimo anio del usuario
     * @param usuario - usuario del que se quiero hacer la consulta               
     * @returns - un array con tantos elementos {timestamp:number, value:number} como dias en el intervalo
     */
    public async getEnviosAnio(usuario: string) {
        //se saca el timeStamp del inicio del dia en el que se hizo la consulta
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const timeFin = hoy.valueOf() / 1000;

        const timeIni = timeFin - 364 * 24 * 60 * 60;

        const datos = await usuarioDAO.getEnviosUsuario(usuario, timeIni, timeFin);

        return datos;
    }

    /**
     * Elimina de Redis los envios con mas de un anio de antiguedad.
     */
    public async eliminarEnviosAntiguos() {
        //se saca el timeStamp del inicio del dia en el que se hizo la consulta
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const hoyTimestamp = hoy.valueOf() / 1000;

        const anioTimestamp = hoyTimestamp - 365 * 24 * 60 * 60;

        usuarioDAO.eliminarEnviosAnterioresDia(anioTimestamp);
    }
    
    /**
     * Devuelve el conteo de cada resultado del usuario ordenado alfabeticamente.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }`.
     */
    public async getResultados(usuario: string) {
        return await usuarioDAO.getResultados(usuario);
    }

    /**
     * Devuelve el conteo de envios por lenguaje del usuario ordenado alfabeticamente.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }`.
     */
    public async getLenguajes(usuario: string) {
        return await usuarioDAO.getLenguajes(usuario);
    }

    /**
     * Devuelve el numero total de envios del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de envios.
     */
    async getNumEnvios(usuario: string): Promise<number> {
        return usuarioDAO.getNumEnvios(usuario);
    }

    /**
     * Devuelve el numero de problemas distintos resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de problemas resueltos.
     */
    async getNumProblemasResueltos(usuario: string): Promise<number> {
        return usuarioDAO.getNumProblemasResueltos(usuario);
    }

    /**
     * Devuelve el numero de problemas resueltos por el usuario en un lenguaje concreto.
     * @param usuario - Identificador del usuario.
     * @param lenguaje - Lenguaje de programacion a filtrar.
     * @returns Numero de problemas resueltos en ese lenguaje.
     */
    async getNumProblemasLenguaje(usuario: string, lenguaje: string): Promise<number> {
        return usuarioDAO.getNumProblemasLenguaje(usuario, lenguaje);
    }

    /**
     * Devuelve el numero de lenguajes distintos que ha usado el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de lenguajes usados.
     */
    async getNumLenguajesUsados(usuario: string): Promise<number> {
        return usuarioDAO.getNumLenguajesUsados(usuario);
    }

    /**
     * Devuelve el numero de categorias distintas de problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de categorias resueltas.
     */
    async getNumCategoriasProblemasResueltos(usuario: string): Promise<number> {
        return usuarioDAO.getNumCategoriasProblemasResueltos(usuario);
    }

    /**
     * Devuelve los identificadores de los problemas resueltos por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de identificadores de problemas.
     */
    async getProblemasResueltos(usuario: string): Promise<string[]> {
        return usuarioDAO.getProblemasResueltos(usuario);
    }

    /**
     * Devuelve la racha actual de envios correctos consecutivos del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de envios correctos consecutivos.
     */
    async getRachaEnviosCorrectos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaEnviosCorrectos(usuario);
    }

    /**
     * Devuelve la racha actual de dias consecutivos con al menos un envio del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Numero de dias consecutivos con envio.
     */
    async getRachaDiasEnviosConsecutivos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaDiasEnviosConsecutivos(usuario);
    }

    /**
     * Devuelve el timestamp del ultimo envio realizado por el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Timestamp Unix del ultimo envio.
     */
    async getUltimoEnvioUsuario(usuario: string): Promise<number> {
        return usuarioDAO.getUltimoEnvioUsuario(usuario);
    }

    /**
     * Devuelve el histograma de horas del dia en las que el usuario ha realizado envios.
     * @param usuario - Identificador del usuario.
     * @returns Array de 24 posiciones con el conteo de envios por hora.
     */
    async getHoras(usuario: string): Promise<number[]> {
        return usuarioDAO.getHoras(usuario);
    }

    /**
     * Devuelve el conteo de envios aceptados por lenguaje del usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ name, value }`.
     */
    async getLenguajesAC(usuario: string): Promise<{ name: string, value: number }[]> {
        return usuarioDAO.getLenguajesAC(usuario);
    }

    /**
     * Devuelve el numero de envios agrupados por dia para el usuario.
     * @param usuario - Identificador del usuario.
     * @returns Array de pares `{ timestamp, value }` con un elemento por dia.
     */
    async getDiasValor(usuario: string): Promise<{ timestamp: number, value: number }[]> {
        return usuarioDAO.getDiasValor(usuario);
    }
}

export default new EstadisticasUsuarioBase();