import UsuarioDAO from '../dao/usuarioDAO.js';
import logros from "./logros/listadoLogros.js";

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

    //Devuelve todos los logros declarando si el usuario los tiene o no y ordenados dependiendo del tipo de clasificacion marcado
    async getLogrosUsuario(usuario: string, clasificacion: string) {
        const setLogros = new Set(await usuarioDAO.getLogros(usuario));

        //agrega el etributo de si el usuario tiene ese logro o no
        const logrosUsuario = logros.map(logro => ({
            nombre: logro.nombre,
            descripcion: logro.descripcion,
            imagen: logro.imagen,
            nivel: logro.nivel,
            categoria: logro.categoria,
            sorpresa: logro.sorpresa,
            obtenido: setLogros.has(logro.nombre)
        }));

        //agrupa todos los logros en los grupos correspondientes segun la clasificacion seleccionada
        const gruposMap = new Map();
        for (const logro of logrosUsuario) {
            const key = clasificacion === "nivel" ? logro.nivel : logro.categoria;
            if (!gruposMap.has(key)) {
                gruposMap.set(key, []);
            }
            gruposMap.get(key).push(logro);
        }

        //transforma el map a una estructura similar a la del tipo TGrupoLogros 
        const grupos = Array.from(gruposMap.entries()).map(([grupo, logros]) => ({ grupo, logros }));
        return { clasificacion, grupos };
    }

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
        return usuarioDAO.getNumCategoriasProblemasResueltos(usuario);
    }

    async getNumFranjasHorariasConEnvio(usuario: string): Promise<number> {
        return usuarioDAO.getNumFranjasHorariasConEnvio(usuario);
    }
}