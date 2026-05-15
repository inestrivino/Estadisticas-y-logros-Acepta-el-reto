import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import xpDAO from "../dao/xpDAO.js";
import usuarioService from "./usuarioService.js";
import { datosXP } from "../types/datos/datosXP.js";
import { Logro } from "./logros/logro.js";
import { NivelLogro } from "../types/enums/nivelLogro.js";

type EstadisticasXP = {
    numEnvios: number,
    numProblemasAC: number,
    numTrofeosBronce: number,
    numTrofeosPlata: number,
    numTrofeosOro: number,
}

export enum NivelUsuario {
    APRENDIZ = "Aprendiz",
    COMPETENTE = "Competente",
    HABIL = "Hábil",
    ESPECIALISTA = "Especialista",
    MAESTRO = "Maestro",
    SIN_NIVEL = ""
}

class XPService {

    /**
     * Calcula y persiste la XP global y por mes de cada usuario a partir de la diferencia entre estados y los trofeos nuevos.
     * @param estadosUsuarioIniciales - Estados de usuario antes del bloque.
     * @param estadosUsuariosFinales - Estados de usuario despues del bloque.
     * @param estadosFinalesPorMes - Estados finales de usuario agrupados por mes.
     * @param nuevosLogrosPorMes - Trofeos nuevos obtenidos agrupados por mes.
     */
    public async procesarXP(
        estadosUsuarioIniciales: Map<string, EstadoUsuario>,
        estadosUsuariosFinales: Map<string, EstadoUsuario>,
        estadosFinalesPorMes: Map<number, Map<string, EstadoUsuario>>,
        nuevosLogrosPorMes: Map<number, Map<string, Set<Logro>>>
    ) {
        const todosLosLogros = new Map<string, Set<Logro>>();
        for (const logrosMes of nuevosLogrosPorMes.values())
            for (const [usuario, logros] of logrosMes) {
                if (!todosLosLogros.has(usuario)) todosLosLogros.set(usuario, new Set());
                for (const logro of logros) todosLosLogros.get(usuario)!.add(logro);
            }

        await xpDAO.registrarBloqueXP(this.calcularXP(estadosUsuarioIniciales, estadosUsuariosFinales, todosLosLogros));

        const bloquesMes = Array.from(estadosFinalesPorMes.entries()).map(([mes, estadosFinales]) => ({
            mes,
            puntos: this.calcularXP(estadosUsuarioIniciales, estadosFinales, nuevosLogrosPorMes.get(mes) ?? new Map())
        }));
        await xpDAO.registrarBloqueXPMes(bloquesMes);
    }

    /**
     * Calcula la XP total correspondiente a las estadisticas indicadas.
     * @param stats - Estadisticas relevantes para el calculo de XP.
     * @returns XP total calculada.
     */
    private calcularXPDesdeEstadisticas(stats: EstadisticasXP): number {
        return stats.numEnvios * 1
            + stats.numProblemasAC * 15
            + stats.numTrofeosBronce * 20
            + stats.numTrofeosPlata * 40
            + stats.numTrofeosOro * 60;
    }

    /**
     * Calcula la XP de cada usuario comparando su estado inicial y final, incluyendo los trofeos nuevos.
     * @param estadosIniciales - Mapa de estados de usuario antes de procesar el bloque.
     * @param estadosFinales - Mapa de estados de usuario despues de procesar el bloque.
     * @param nuevosTrofeos - Trofeos nuevos obtenidos por cada usuario.
     * @returns Array de objetos { usuario, xp } con la XP calculada para cada usuario.
     */
    private calcularXP(
        estadosIniciales: Map<string, EstadoUsuario>,
        estadosFinales: Map<string, EstadoUsuario>,
        nuevosTrofeos: Map<string, Set<Logro>>
    ): datosXP[] {
        return Array.from(estadosFinales.entries()).map(([usuario, estadoFinal]) => {
            const estadoInicial = estadosIniciales.get(usuario) ?? {} as EstadoUsuario;
            const logros = nuevosTrofeos.get(usuario) ?? new Set<Logro>();
            const xp = this.calcularXPDesdeEstadisticas({
                numEnvios: (estadoFinal.numEnvios ?? 0) - (estadoInicial.numEnvios ?? 0),
                numProblemasAC: (estadoFinal.problemasAC?.size ?? 0) - (estadoInicial.problemasAC?.size ?? 0),
                numTrofeosBronce: [...logros].filter(l => l.nivel === NivelLogro.BRONCE).length,
                numTrofeosPlata:  [...logros].filter(l => l.nivel === NivelLogro.PLATA).length,
                numTrofeosOro:    [...logros].filter(l => l.nivel === NivelLogro.ORO).length,
            });
            return { usuario, xp };
        });
    }

    /**
     * Resetea todos los registros de la xp en la base de datos para todos los usuarios.
     */
    public async resetearXP() {
        await xpDAO.resetearXP();
    }

    //============================== CONSULTAS ==============================

    /**
     * Devuelve la XP acumulada por el usuario en cada mes, con el nombre abreviado del mes.
     * @param usuario - Identificador del usuario.
     * @returns Array de 12 entradas con el mes abreviado y su XP.
     */
    async getXPUsuarioPorMes(usuario: string): Promise<{ mes: string, puntos: number }[]> {
        const NOMBRES_MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

        const [xpTotal, xpPorMes] = await Promise.all([
            xpDAO.getXPUsuario(usuario),
            xpDAO.getXPUsuarioPorMes(usuario)
        ]);

        const xpMesMap = new Map(xpPorMes.map(({ mes, xp }) => [mes, xp]));
        const mesActual = new Date().getUTCMonth();

        const resultado: { mes: string, puntos: number }[] = [];
        let xpAcumulada = xpTotal < 0 ? 0 : xpTotal;

        //se va hacia atras restando la xp de cada mes para obtener la xp al final de ese mes
        for (let i = 0; i < 12; i++) {
            const mes = (mesActual - i + 12) % 12;
            resultado.unshift({ mes: NOMBRES_MESES[mes], puntos: Math.max(0, Math.round(xpAcumulada)) });
            xpAcumulada -= xpMesMap.get(mes) ?? 0;
        }

        return resultado;
    }

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