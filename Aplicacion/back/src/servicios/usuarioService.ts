import UsuarioDAO from '../dao/usuarioDAO.js';

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

    //TODO adaptarlo al modo servicio, por ejemplo que sea el servicio el que ponga el formato de salida de la clasificaicion y no el dao
    async getLogrosUsuario(usuario: string, clasificacion: string) {
        return usuarioDAO.getLogrosUsuario(usuario, clasificacion);
    }

    //TODO creo que este no tiene que estar aqui
    async guardarLogros(usuario: string, logros: string[], pipeline?: any) {
        return usuarioDAO.guardarLogros(usuario, logros, pipeline)
    }

    //TODO IMPORTANTE mirar si necesito poner await para todos estos
    async getNumEnvios(usuario: string): Promise<number> {
        return usuarioDAO.getNumEnvios(usuario);
    }

    async getNumProblemasResueltos(usuario: string): Promise<number> {
        return usuarioDAO.getNumProblemasResueltos(usuario);
    }

    async tieneProblemaEnvioIncorrecto(usuario: string, problema: string): Promise<boolean> {
        return usuarioDAO.tieneProblemaEnvioIncorrecto(usuario, problema);
    }

    async getNumProblemasLenguaje(usuario: string, lenguaje: string): Promise<number> {
        return usuarioDAO.getNumProblemasLenguaje(usuario, lenguaje);
    }

    async getNumLenguajesUsados(usuario: string): Promise<number> {
        return usuarioDAO.getNumLenguajesUsados(usuario);
    }

    async getRachaMaximaEnviosCorrectos(usuario: string): Promise<number> {
        return usuarioDAO.getRachaMaximaEnviosCorrectos(usuario);
    }

    async getRachaMaximaDiasConEnvio(usuario: string): Promise<number> {
        return usuarioDAO.getRachaMaximaDiasConEnvio(usuario);
    }

    async getNumCategoriasProblemasResueltos(usuario: string): Promise<number> {
        return this.getNumCategoriasProblemasResueltos(usuario);
    }

    async getNumFranjasHorariasConEnvio(usuario: string): Promise<number> {
        return this.getNumFranjasHorariasConEnvio(usuario);
    }
}