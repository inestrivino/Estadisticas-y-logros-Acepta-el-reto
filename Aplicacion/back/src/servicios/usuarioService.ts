import usuarioDAO from '../dao/usuarioDAO.js';
import { EnvioProcesado } from '../types/envioProcesado.js';

class UsuarioService {

    /**
     * Persiste un bloque de envios en el DAO del usuario.
     * @param envios - Array de envios en formato procesado.
     */
    public async registrarBloqueEnvios(envios: EnvioProcesado[]) {
        await usuarioDAO.registrarBloqueEnvios(
            envios.map(envio => ({
                envioId: envio.envioId,
                usuario: envio.usuario,
                problema: envio.problema,
                categoria: "",
                resultado: envio.resultado,
                lenguaje: envio.lenguaje,
                fecha: envio.fecha,
                hora: envio.hora,
            }))
        );
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
}

export default new UsuarioService();