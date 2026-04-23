import { datosLogro } from "../types/datosLogro.js";
import { EnvioProcesado } from "../types/envioProcesado.js";
import { Logro, NivelLogro } from "../types/logro.js";
import logrosService from "./logros/logrosService.js";
import XPDAO from "../dao/xpDAO.js"
import xpDAO from "../dao/xpDAO.js";
import usuarioService from "./usuarioService.js";

class XPService {

    private xpUsuarios = new Map<string, number>();

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
    }

    private calcularXPDeLogros(nombreLogros: string[]): number {
        let xp = 0;
        for (const logro of nombreLogros.map(l => logrosService.getLogroByName(l))) {
            if (logro !== undefined)
                xp += this.getXPPorNivelLogro(logro.nivel)
        }
        return xp;
    }

    private getXPPorResultadoEnvio(resultado: string): number {
        return resultado === "AC" ? 15 : 1;
    }

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
         * @param usuario - Identificador del usuario o "" dependiendo de si se quiere filtrar por nivel o no.
         * @returns Array de nombre y xp o nombre, xp y nivel de los usuarios que se encuentran en el rango indicado.
         */
    async getUsuariosRanking(pag: number, tam: number, usuario: string) {
        const ini = (pag - 1) * tam;
        const fin = pag * tam - 1;
        if (!usuario) {
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
     * @returns Numero de usuario a partir de lo especificado.
     */
    async getNumUsuarios(usuario: string): Promise<number> {
        if (usuario === "") {
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