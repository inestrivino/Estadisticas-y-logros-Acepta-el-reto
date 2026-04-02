import UsuarioDAO from 'src/dao/usuarioDAO.js';

const usuarioDAO = new UsuarioDAO();

export default class UsuarioService {

    getResultados(usuario: string) {
        return usuarioDAO.getResultados(usuario);
    }

    getLenguajes(usuario: string) {
        return usuarioDAO.getLenguajes(usuario);
    }

    /**
     * Devuelve los envios del ultimo anio del usuario
     * @param usuario - usuario del que se quiero hacer la consulta               
     * @returns - un array con tantos elementos {timestamp:number, value:number} como dias en el intervalo
     */
    async getEnviosAnio(usuario: string) {
        //se saca el timeStamp del inicio del dia en el que se hizo la consulta
        const hoy = new Date;
        hoy.setHours(0, 0, 0, 0);
        const timeFin = hoy.valueOf() / 1000;

        const timeIni = timeFin - 364 * 24 * 60 * 60;

        const datos = await usuarioDAO.getEnviosUsuario(usuario, timeIni, timeFin);

        return datos;
    }
}