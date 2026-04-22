import UsuarioDAO from '../dao/usuarioDAO.js';
import logros from "./logros/Logros.js";

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

    /**
     * Devuelve los usuarios correspondientes a la pagina indicada, respecto al ranking global de usuarios ordenados por xp.
     * @param pag - Numero de la pagina.
     * @param tam - Tamaño de la pagina, que corresponde al numero de usuarios que se van a devolver.
     * @param usuario - Identificador del usuario o "" dependiendo de si se quiere filtrar por nivel o no.
     * @returns Array de nombre y xp o nombre, xp y nivel de los usuarios que se encuentran en el rango indicado.
     */
    async getUsuariosRanking(pag: number, tam: number, usuario: string) {
        const ini = (pag - 1) * tam;
        const fin = pag * tam - 1;
        if (!usuario) {
            const usuarios = await usuarioDAO.getUsuariosRankingPorRango(ini, fin);
            return usuarios.map(u => ({
                nombre: u.value,
                xp: u.score,
                nivel: this.getNivelFromXP(u.score)
            }));
        }
        else {
            const xp = await usuarioDAO.getXPUsuario(usuario);
            const nivel = this.getNivelFromXP(xp);
            const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
            const usuarios = usuarioDAO.getUsuariosRankingPorRangoYNivel(ini, fin, iniXP, finXP)
            return (await usuarios).map(u => ({
                nombre: u.value,
                xp: u.score
            }))
        }
    }

    /**
     * Devuelve el numero de usuarios dependiendo de: si usuario es "", devuelve todos los guardados en la bd; si usuario se especifica, 
     * se devuelve el numero de usuario que pertenecen al mismo nivel (de xp) que este.
     * @param usuario - Identificador del usuario o "" en caso de no querer limitar por nivel.
     * @returns Numero de usuario a partir de lo especificado.
     */
    async getNumUsuarios(usuario: string): Promise<number> {
        if (usuario === "") {
            return usuarioDAO.getNumUsuarios();
        }
        else {
            const nivel = await this.getNivelUsuario(usuario);
            const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
            return usuarioDAO.getNumUsuariosEnRango(iniXP, finXP);
        }
    }

    /**
     * Devuelve el nivel al que pertenece el usuario a partir del xp que tiene.
     * @param usuario - Identificador del usuario.
     * @returns String del nombre del nivel al que pertenece.
     */
    async getNivelUsuario(usuario: string) {
        const xp = await usuarioDAO.getXPUsuario(usuario);
        return this.getNivelFromXP(xp);
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

    //TODO a lo mejor esto se tendria que cambiar a xpService
    /**
     * Devuelve el nivel al que corresponde esa cantidad de xp.
     * @param xp - Cantidad de xp.
     * @returns String correspondiente al nivel.
     */
    private getNivelFromXP(xp: number) {
        if (xp !== -1) {
            if (xp <= 100) return "Aprendiz"
            if (xp <= 500) return "Competente"
            if (xp <= 1000) return "Hábil"
            if (xp <= 2000) return "Especialista"
            return "Maestro"
        }
        return "";
    }

    /**
     * Devuelve el rango de xp que corresponde a cada nivel.
     * @param nivel - String correspondiente al nivel.
     * @returns Valores de inicio y fin que marcan el rango de xp que corresponden al nivel (ambos incluidos).
     */
    private getXPRangeFromNivel(nivel: string): { iniXP: number, finXP: number } {
        switch (nivel) {
            case "Aprendiz": return { iniXP: 0, finXP: 100 };
            case "Competente": return { iniXP: 101, finXP: 500 };
            case "Hábil": return { iniXP: 501, finXP: 1000 };
            case "Especialista": return { iniXP: 1001, finXP: 2000 };
            case "Maestro": return { iniXP: 2001, finXP: Number.MAX_VALUE };
            default: return { iniXP: Number.MIN_VALUE, finXP: Number.MAX_VALUE };
        }
    }
}