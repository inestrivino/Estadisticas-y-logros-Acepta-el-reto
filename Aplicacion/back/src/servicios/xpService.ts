import { datosLogro } from "../types/datosLogro.js";
import { EnvioProcesado } from "../types/envioProcesado.js";
import { Logro, NivelLogro } from "../types/logro.js";
import { EstadoUsuario } from "../types/estadoUsuario.js";
import logrosService from "./logros/logrosService.js";
import XPDAO from "../dao/xpDAO.js"
import xpDAO from "../dao/xpDAO.js";
import usuarioService from "./usuarios/estadisticasUsuarioBaseService.js";

class XPService {

    private xpUsuarios = new Map<string, number>();

    /**
     * Calcula los xp obtenidos por cada usuario a partir de un bloque de envios. Primero recorre los envios para calcular los
     *  puntos a partir del resultado obtenido en cada envio (acierto o no). Luego calcula los puntos obtenidos a partir de
     *  los logros alcanzados por cada usuario.
     * @param envios - Array de envios procesados del bloque.
     * @param listadoLogros - Array de logros procesados del bloque.
     */
    public async procesarBloqueEnvios(envios: EnvioProcesado[], listadoLogros: datosLogro[]) {
        
        for (const envio of envios) {
            if (!this.xpUsuarios.has(envio.usuario))
                this.xpUsuarios.set(envio.usuario, 0);
            const xp = this.xpUsuarios.get(envio.usuario) as number + this.getXPPorResultadoEnvio(envio.resultado);
            this.xpUsuarios.set(envio.usuario, xp);
        }

        for (const { usuario, logros } of listadoLogros) {
            const xp = (this.xpUsuarios.has(usuario) ? this.xpUsuarios.get(usuario) : 0) as number + this.calcularXPDeLogros(logros);
            this.xpUsuarios.set(usuario, xp);
        }

        const puntos = Array.from(this.xpUsuarios.entries()).map(([usuario, xp]) => ({ usuario, xp }));
        await XPDAO.registrarBloqueXP(puntos);
        return puntos;
    }

    /**
     * Calcula los xp obtenidos por cada usuario a partir de la diferencia entre su estado inicial y final en el bloque.
     * Los xp por envios se derivan del incremento en numEnvios y resultados AC. Los xp por logros se derivan de los
     * logros nuevos que aparecen en el estado final pero no en el inicial.
     * @param estadosIniciales - Mapa de estados de usuario antes de procesar el bloque.
     * @param estadosFinales - Mapa de estados de usuario despues de procesar el bloque.
     */
    public async procesarBloqueEstados(
        estadosIniciales: Map<string, EstadoUsuario>,
        estadosFinales: Map<string, EstadoUsuario>
    ) {
        this.xpUsuarios = new Map<string, number>();

        for (const [usuario, estadoFinal] of estadosFinales) {
            const estadoInicial = estadosIniciales.get(usuario);

            const acFinal = estadoFinal.resultados.get("AC") ?? 0;
            const acInicial = estadoInicial?.resultados.get("AC") ?? 0;
            const enviosAC = acFinal - acInicial;
            const totalEnvios = estadoFinal.numEnvios - (estadoInicial?.numEnvios ?? 0);
            const enviosNoAC = totalEnvios - enviosAC;

            const logrosNuevos = [...estadoFinal.logros].filter(l => !estadoInicial?.logros.has(l));

            const xp = enviosAC * 15 + enviosNoAC * 1 + this.calcularXPDeLogros(logrosNuevos);
            this.xpUsuarios.set(usuario, xp);
        }

        const puntos = Array.from(this.xpUsuarios.entries()).map(([usuario, xp]) => ({ usuario, xp }));
        await XPDAO.registrarBloqueXP(puntos);
    }

    /**
     * Devuelve los xp correspondientes al conjunto de logros que se pasa.
     * @param nombreLogros - Listado de identificadores (nombres) de los logros.
     * @returns Numero entero positivo.
     */
    private calcularXPDeLogros(nombreLogros: string[]): number {
        let xp = 0;
        for (const logro of nombreLogros.map(l => logrosService.getLogroByName(l))) {
            if (logro !== undefined)
                xp += this.getXPPorNivelLogro(logro.nivel)
        }
        return xp;
    }

    /**
     * Devuelve los xp correspondientes al resultado obtenido del envio.
     * @param resultado - Identificador del resultado.
     * @returns Numero entero positivo.
     */
    private getXPPorResultadoEnvio(resultado: string): number {
        return resultado === "AC" ? 15 : 1;
    }

    /**
     * Devuelve los xp correspondientes al nivel de logro obtenido.
     * @param nivel - Identificador del nivel.
     * @returns Numero entero positivo.
     */
    private getXPPorNivelLogro(nivel: NivelLogro): number {
        switch (nivel) {
            case NivelLogro.BRONCE: return 20;
            case NivelLogro.PLATA: return 40;
            case NivelLogro.ORO: return 60;
        }
    }

    /**
     * Devuelve los usuarios correspondientes a la pagina indicada, respecto al ranking global de usuarios ordenados por xp.
     * @param pag - Numero de la pagina.
     * @param tam - Tamaño de la pagina, que corresponde al numero de usuarios que se van a devolver.
     * @param filtrarPorNivel - Indica si queremos filtrar los usuario que devolvemos por el nivel del usuario.
     * @param usuario - Identificador del usuario si se quiere filtrar por nivel o no.
     * @returns Array de nombre y xp o nombre, xp y nivel de los usuarios que se encuentran en el rango indicado.
     */
    async getUsuariosRanking(pag: number, tam: number, filtrarPorNivel: boolean, usuario: string) {
        const ini = (pag - 1) * tam;
        const fin = pag * tam - 1;
        if (!filtrarPorNivel) {
            const usuarios = await xpDAO.getUsuariosRankingPorRango(ini, fin);
            return usuarios.map(u => ({
                nombre: u.value,
                xp: u.score,
                nivel: this.getNivelFromXP(u.score)
            }));
        }
        else {
            const xp = await xpDAO.getXPUsuario(usuario);
            const nivel = this.getNivelFromXP(xp);
            const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
            const usuarios = await xpDAO.getUsuariosRankingPorRangoYNivel(ini, fin, iniXP, finXP)
            return usuarios.map(u => ({
                nombre: u.value,
                xp: u.score,
                nivel: nivel
            }))
        }
    }

    /**
     * Devuelve el numero de usuarios dependiendo de: si usuario es "", devuelve todos los guardados en la bd; si usuario se especifica, 
     * se devuelve el numero de usuario que pertenecen al mismo nivel (de xp) que este.
     * @param usuario - Identificador del usuario o "" en caso de no querer limitar por nivel.
     * @param filtrarPorNivel - Indica si queremos filtrar los usuario que devolvemos por el nivel del usuario.
     * @returns Numero de usuario a partir de lo especificado.
     */
    async getNumUsuarios(filtrarPorNivel: boolean, usuario: string): Promise<number> {
        if (!filtrarPorNivel) {
            return xpDAO.getNumUsuarios();
        }
        else {
            const nivel = await this.getNivelUsuario(usuario);
            const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
            return xpDAO.getNumUsuariosEnRango(iniXP, finXP);
        }
    }

    /**
     * Devuelve el nivel al que pertenece el usuario a partir del xp que tiene.
     * @param usuario - Identificador del usuario.
     * @returns String del nombre del nivel al que pertenece.
     */
    async getNivelUsuario(usuario: string) {
        const xp = await xpDAO.getXPUsuario(usuario);
        return this.getNivelFromXP(xp);
    }

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
    public getXPRangeFromNivel(nivel: string): { iniXP: number, finXP: number } {
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

export default new XPService();