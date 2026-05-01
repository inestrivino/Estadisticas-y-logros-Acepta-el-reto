import usuarioDAO from '../dao/usuarioDAO.js';
import { EnvioProcesado } from '../types/envioProcesado.js';
import { EstadoUsuario } from '../types/estadoUsuario.js';
import xpService from './xpService.js';

class UsuarioService {

    /**
     * Persiste un bloque de envios en el DAO del usuario.
     * @param envios - Array de envios en formato procesado.
     */
    /*
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
    */

    async registrarEstadosUsuarios(estadosUsuarios: Map<string, EstadoUsuario>): Promise<void> {
        await usuarioDAO.registrarEstadosUsuarios(estadosUsuarios);
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

    async getNumEnvios(usuario: string): Promise<number> {
        return usuarioDAO.getNumEnvios(usuario);
    }

    async getNumProblemasResueltos(usuario: string): Promise<number> {
        return usuarioDAO.getNumProblemasResueltos(usuario);
    }

    async getNumProblemasLenguaje(usuario: string, lenguaje: string): Promise<number> {
        return usuarioDAO.getNumProblemasLenguaje(usuario, lenguaje);
    }

    async getNumLenguajesUsados(usuario: string): Promise<number> {
        return usuarioDAO.getNumLenguajesUsados(usuario);
    }

    async getNumCategoriasProblemasResueltos(usuario: string): Promise<number> {
        return usuarioDAO.getNumCategoriasProblemasResueltos(usuario);
    }

    async getProblemasResueltos(usuario: string): Promise<string[]> {
        return usuarioDAO.getProblemasResueltos(usuario);
    }

    async getRachaEnviosCorrectos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaEnviosCorrectos(usuario);
    }

    async getRachaDiasEnviosConsecutivos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaDiasEnviosConsecutivos(usuario);
    }

    async getUltimoEnvioUsuario(usuario: string): Promise<number> {
        return usuarioDAO.getUltimoEnvioUsuario(usuario);
    }

    async getHoras(usuario: string): Promise<number[]> {
        return usuarioDAO.getHoras(usuario);
    }

    async getLenguajesAC(usuario: string): Promise<{ name: string, value: number }[]> {
        return usuarioDAO.getLenguajesAC(usuario);
    }

    async getDiasValor(usuario: string): Promise<{ timestamp: number, value: number }[]> {
        return usuarioDAO.getDiasValor(usuario);
    }

    /**
     * Devuelve si el usuario existe en la bd o no.
     * @param usuario - Identificador del usuario.
     */
    public async existeUsuario(usuario: string): Promise<boolean> {
        const u = usuario.toLowerCase().normalize("NFC").trim();
        return await usuarioDAO.existeUsuario(u);
    }

    public async getUsuariosSugeridos(patron: string): Promise<string[]> {
        const p = patron.toLowerCase().normalize("NFC").trim();
        return usuarioDAO.getUsuariosSugeridos(p);
    }
}

export default new UsuarioService();