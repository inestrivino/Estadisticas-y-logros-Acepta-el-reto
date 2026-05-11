import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import xpDAO from "../dao/xpDAO.js";
import { NivelLogro } from "../types/enums/nivelLogro.js";

import { ActualizadorXP } from "./actualizadoresXP/xpActualizadorInterface.js";
import numEnviosXP from "./actualizadoresXP/numEnvioActualizadorXP.js";
import problemasXP from "./actualizadoresXP/resultadosActualizadorXP.js";
import logrosXP from "./actualizadoresXP/logrosActualizadorXP.js";

export enum NivelUsuario {
    APRENDIZ = "Aprendiz",
    COMPETENTE = "Competente",
    HABIL = "Hábil",
    ESPECIALISTA = "Especialista",
    MAESTRO = "Maestro",
    SIN_NIVEL = ""
}

class XPService {

    private actualizadoresXP: ActualizadorXP[] = [
        numEnviosXP,
        problemasXP,
        logrosXP
    ]

    /**
     * Calcula los xp obtenidos por cada usuario a partir de la diferencia entre su estado inicial y final,
     * delegando en cada actualizador registrado en actualizadoresXP.
     * @param estadosIniciales - Mapa de estados de usuario antes de procesar el bloque.
     * @param estadosFinales - Mapa de estados de usuario despues de procesar el bloque (puede ser parcial).
     * @returns Array de pares { usuario, xp } con los puntos acumulados en el bloque.
     */
    public async procesarBloqueEstados(
        estadosIniciales: Map<string, EstadoUsuario>,
        estadosFinales: Map<string, EstadoUsuario>
    ) {
        const xpUsuarios = new Map<string, number>();

        for (const [usuario, estadoFinal] of estadosFinales) {
            const estadoInicial = estadosIniciales.get(usuario) ?? {} as EstadoUsuario;

            //transforma un array en un único valor final aplicando una función acumuladora a cada elemento
            //el acumulado empieza en 0
            const xp = this.actualizadoresXP.reduce((acc, act) => {

                //se mira si el estado final tiene la estadistica de este actualizador
                const calculado = estadoFinal[act.id as keyof EstadoUsuario] !== undefined;

                //si no lo tienen devuelve el acumulado de la experiencia de este bloque
                return calculado ? acc + act.actualizar(estadoInicial, estadoFinal) : acc;

            }, 0);

            xpUsuarios.set(usuario, xp);
        }

        const puntos = Array.from(xpUsuarios.entries()).map(([usuario, xp]) => ({ usuario, xp }));
        await xpDAO.registrarBloqueXP(puntos);
        return puntos;
    }

    public async resetearXP() {
        await xpDAO.resetearXP();
    }

    public actualizadoresIDs(): string[] {
        const ids: string[] = [];

        for (const actualizador of this.actualizadoresXP) {
            ids.push(actualizador.id);
        }

        return ids;
    }

    //============================== CONSULTAS ==============================
    /**
     * Devuelve la informacion del usuario asociada a los xp y su ranking.
     * @param filtrarPorNivel - Indica si la informacion es respecto al ranking global o al perteneciente al nivel del usuario.
     * @param usuario - Identificador del usuario.
     * @returns El nombre, el nivel, los xp y la posicion del usuario en el ranking (varia si es con respecto al ranking global 
     *  o solo de su nivel).
     */
    async getInfoUsuarioRanking(usuario: string, filtrarNivel: boolean) {
        const nivel = await this.getNivelUsuario(usuario);
        const xp = await xpDAO.getXPUsuario(usuario);

        const pos =
            filtrarNivel ?
                await this.getPosUsuarioEnRankingPorNivel(usuario, nivel) :
                await xpDAO.getPosUsuarioEnRanking(usuario);

        return { nombre: usuario, nivel, xp, pos };
    }

    /**
     * Devuelve la posicion del usuario en el ranking de su nivel.
     * @param nivel - Identificador del nivel del usuario
     * @param usuario - Identificador del usuario si se quiere filtrar por nivel o no.
     * @returns Entero positivo. //TODO lanzar error en caso de que la posicion sea negativa
     */
    private async getPosUsuarioEnRankingPorNivel(usuario: string, nivel: string) {
        // rango de xp correspondiente al nivel del usuario
        const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
        // primer usuario en el ranking que pertenece a ese nivel
        const primerUsuarioNivel = (await xpDAO.getUsuariosRankingPorRangoYNivel(0, 1, iniXP, finXP))[0];
        // posicion del ranking global en la que se encuentra el primer usuario que pertenece a ese nivel
        const posPrimerUsuario = await xpDAO.getPosUsuarioEnRanking(primerUsuarioNivel.value);
        // posicion del ranking global en la que se encuentra el usuario
        const posGlobalUsuario = await xpDAO.getPosUsuarioEnRanking(usuario);

        return posGlobalUsuario - posPrimerUsuario + 1;
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
            return usuarios.map((u, i) => ({
                nombre: u.value,
                xp: u.score,
                nivel: this.getNivelFromXP(u.score),
                pos: ini + i + 1
            }));
        }
        else {
            const xp = await xpDAO.getXPUsuario(usuario);
            const nivel = this.getNivelFromXP(xp);
            const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
            const usuarios = await xpDAO.getUsuariosRankingPorRangoYNivel(ini, fin, iniXP, finXP)
            return usuarios.map((u, i) => ({
                nombre: u.value,
                xp: u.score,
                nivel: nivel,
                pos: ini + i + 1
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
            default: return 0;
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
    private getNivelFromXP(xp: number): NivelUsuario {
        if (xp !== -1) {
            if (xp <= 100) return NivelUsuario.APRENDIZ;
            if (xp <= 500) return NivelUsuario.COMPETENTE;
            if (xp <= 1000) return NivelUsuario.HABIL;
            if (xp <= 2000) return NivelUsuario.ESPECIALISTA;
            return NivelUsuario.MAESTRO;
        }
        return NivelUsuario.SIN_NIVEL;
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

    async getPosUsuarioEnRanking(usuario: string): Promise<number> {
        return await xpDAO.getPosUsuarioEnRanking(usuario);
    }

}

export default new XPService();