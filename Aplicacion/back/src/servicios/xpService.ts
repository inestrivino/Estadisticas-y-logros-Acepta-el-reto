import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import xpDAO from "../dao/xpDAO.js";
import usuarioDAO from "../dao/usuarioDAO.js";
import { datosXP } from "../types/datos/datosXP.js";
import { Logro } from "./logros/logro.js";
import { EstadisticaExperiencia } from "./experiencia/estadistica.js";
import { enviosEstadistica } from "./experiencia/estadisticas/envios.js";
import { problemasACEstadistica } from "./experiencia/estadisticas/problemasAC.js";
import { logrosEstadistica } from "./experiencia/estadisticas/logros.js";

export enum NivelUsuario {
    APRENDIZ = "Aprendiz",
    COMPETENTE = "Competente",
    HABIL = "Hábil",
    ESPECIALISTA = "Especialista",
    MAESTRO = "Maestro",
    SIN_NIVEL = ""
}

class XPService {

    //lista de estadisticas que componen la experiencia, cada una sabe cuanta xp aporta
    //y, si procede, como persistirse por mes. para anadir una nueva basta con crear una
    //EstadisticaExperiencia y registrarla aqui.
    private estadisticas: EstadisticaExperiencia[] = [
        enviosEstadistica,
        problemasACEstadistica,
        logrosEstadistica,
    ];

    /**
     * Calcula y persiste la XP global y por mes de cada usuario y la persistencia por mes
     * de cada estadistica registrada en `estadisticas`.
     * @param estadosIniciales - Estados de usuario antes del bloque.
     * @param estadosFinales - Estados de usuario despues del bloque.
     * @param estadosFinalesPorMes - Estados finales de usuario agrupados por mes (ultimos 12 meses).
     * @param nuevosLogros - Logros nuevos obtenidos en el bloque (todos, sin filtro por fecha).
     * @param nuevosLogrosPorMes - Logros nuevos obtenidos agrupados por mes (solo ultimos 12 meses).
     */
    public async procesarExperiencia(
        estadosIniciales: Map<string, EstadoUsuario>,
        estadosFinales: Map<string, EstadoUsuario>,
        estadosFinalesPorMes: Map<number, Map<string, EstadoUsuario>>,
        nuevosLogros: Map<string, Set<Logro>>,
        nuevosLogrosPorMes: Map<number, Map<string, Set<Logro>>>
    ) {
        //se registra la xp global del bloque
        await xpDAO.registrarBloqueXP(this.calcularXP(estadosIniciales, estadosFinales, nuevosLogros));

        //se recorre cada mes para calcular su xp y encolar la persistencia por mes de cada estadistica
        const meses = [...estadosFinalesPorMes.keys()].sort((a, b) => a - b);
        const pipeline = usuarioDAO.iniciarPipeline();
        const estadosPrevios = new Map<string, EstadoUsuario>(estadosIniciales);
        const bloquesMes: { mes: number, puntos: datosXP[] }[] = [];

        for (const mes of meses) {
            const estadosFinalesMes = estadosFinalesPorMes.get(mes)!;
            const nuevosLogrosMes = nuevosLogrosPorMes.get(mes) ?? new Map<string, Set<Logro>>();

            //se calcula la xp del mes comparando el estado final del mes con el inicial del bloque
            bloquesMes.push({ mes, puntos: this.calcularXP(estadosIniciales, estadosFinalesMes, nuevosLogrosMes) });

            //se encola por mes cada estadistica comparando el final del mes anterior con el final del mes actual
            for (const [usuario, estadoFinalMes] of estadosFinalesMes) {
                const anterior = estadosPrevios.get(usuario) ?? {} as EstadoUsuario;
                const logrosMes = nuevosLogrosMes.get(usuario) ?? new Set<Logro>();
                for (const est of this.estadisticas)
                    est.registrarMes?.(pipeline, usuario, mes, anterior, estadoFinalMes, logrosMes);
                estadosPrevios.set(usuario, estadoFinalMes);
            }
        }

        await xpDAO.registrarBloqueXPMes(bloquesMes);
        await pipeline.exec();
    }

    /**
     * Calcula la XP de cada usuario sumando la aportacion de cada estadistica registrada.
     * @param estadosIniciales - Mapa de estados de usuario antes del periodo.
     * @param estadosFinales - Mapa de estados de usuario al final del periodo.
     * @param nuevosLogros - Logros nuevos obtenidos por cada usuario en el periodo.
     * @returns Array de objetos { usuario, xp } con la XP calculada para cada usuario.
     */
    private calcularXP(
        estadosIniciales: Map<string, EstadoUsuario>,
        estadosFinales: Map<string, EstadoUsuario>,
        nuevosLogros: Map<string, Set<Logro>>
    ): datosXP[] {
        return Array.from(estadosFinales.entries()).map(([usuario, estadoFinal]) => {
            const estadoInicial = estadosIniciales.get(usuario) ?? {} as EstadoUsuario;
            const logros = nuevosLogros.get(usuario) ?? new Set<Logro>();
            const xp = this.estadisticas.reduce(
                (suma, est) => suma + est.calcularXP(estadoInicial, estadoFinal, logros),
                0
            );
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
     * Devuelve los usuarios correspondientes a la pagina indicada del ranking, opcionalmente filtrados por nivel.
     * @param pag - Numero de la pagina.
     * @param tam - Tamaño de la pagina.
     * @param nivel - Nombre del nivel por el que filtrar, o cadena vacia para no filtrar.
     * @returns Array de objetos con nombre, xp, nivel y posicion de cada usuario.
     */
    async getUsuariosRanking(pag: number, tam: number, nivel: string) {
        const ini = (pag - 1) * tam;
        const fin = pag * tam - 1;
        if (!nivel) {
            const usuarios = await xpDAO.getUsuariosRankingPorRango(ini, fin);
            return usuarios.map((u, i) => ({
                nombre: u.value,
                xp: u.score,
                nivel: this.getNivelFromXP(u.score),
                pos: ini + i + 1
            }));
        }
        const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
        const usuarios = await xpDAO.getUsuariosRankingPorRangoYNivel(ini, fin, iniXP, finXP);
        return usuarios.map((u, i) => ({
            nombre: u.value,
            xp: u.score,
            nivel,
            pos: ini + i + 1
        }));
    }

    /**
     * Devuelve el numero de usuarios del ranking, opcionalmente filtrado por nivel.
     * @param nivel - Nombre del nivel por el que filtrar, o cadena vacia para contar todos.
     * @returns Numero de usuarios que cumplen el filtro.
     */
    async getNumUsuarios(nivel: string): Promise<number> {
        if (!nivel)
            return xpDAO.getNumUsuarios();
        const { iniXP, finXP } = this.getXPRangeFromNivel(nivel);
        return xpDAO.getNumUsuariosEnRango(iniXP, finXP);
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
        switch (nivel.normalize("NFC")) {
            case NivelUsuario.APRENDIZ: return { iniXP: 0, finXP: 100 };
            case NivelUsuario.COMPETENTE: return { iniXP: 101, finXP: 500 };
            case NivelUsuario.HABIL: return { iniXP: 501, finXP: 1000 };
            case NivelUsuario.ESPECIALISTA: return { iniXP: 1001, finXP: 2000 };
            case NivelUsuario.MAESTRO: return { iniXP: 2001, finXP: Number.MAX_VALUE };
            default: return { iniXP: Number.MIN_VALUE, finXP: Number.MAX_VALUE };
        }
    }

    async getPosUsuarioEnRanking(usuario: string): Promise<number> {
        return await xpDAO.getPosUsuarioEnRanking(usuario);
    }

}

export default new XPService();