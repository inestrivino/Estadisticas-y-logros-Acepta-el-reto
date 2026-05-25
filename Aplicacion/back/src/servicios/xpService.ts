import { EstadoUsuario } from "../types/estados/estadoUsuario.js";
import xpDAO from "../dao/xpDAO.js";
import usuarioDAO from "../dao/usuarioDAO.js";
import { datosXP } from "../types/datos/datosXP.js";
import { Logro } from "./logros/logro.js";
import { EstadisticaExperiencia } from "./experiencia/estadistica.js";
import { enviosEstadistica } from "./experiencia/estadisticas/envios.js";
import { problemasACEstadistica } from "./experiencia/estadisticas/problemasAC.js";
import logrosService from "./logrosService.js";
import estadosService from "./estadosService.js";
import { NivelUsuario } from "shared";

//valor a partir del cual el usuario tiene ese nivel
enum UmbralNivel {
    APRENDIZ     = 0,
    COMPETENTE   = 500,
    HABIL        = 1000,
    ESPECIALISTA = 2000,
    PROFESIONAL  = 5000,
}

class XPService {

    //lista de estadisticas que componen la experiencia, cada una sabe cuanta xp aporta
    //y, si procede, como persistirse por mes. para anadir una nueva basta con crear una
    //EstadisticaExperiencia y registrarla aqui.
    private estadisticas: EstadisticaExperiencia[] = [
        enviosEstadistica,
        problemasACEstadistica,
    ];

    /**
     * Calcula y persiste la XP global y por mes de cada usuario y la persistencia por mes
     * de cada estadistica registrada en `estadisticas`. Solo se tienen en cuenta las
     * estadisticas cuyo checkpoint este por detras del bloque (las que aun no han
     * procesado los envios del bloque), para evitar acumular XP que ya fue contada.
     * @param estadosIniciales - Estados de usuario antes del bloque.
     * @param estadosFinales - Estados de usuario despues del bloque.
     * @param estadosFinalesPorMes - Estados finales de usuario agrupados por mes (ultimos 12 meses).
     * @param nuevosLogros - Logros nuevos obtenidos en el bloque (todos, sin filtro por fecha).
     * @param nuevosLogrosPorMes - Logros nuevos obtenidos agrupados por mes (solo ultimos 12 meses).
     * @param checkpointsStats - Checkpoint actual de cada estadistica por id.
     * @param lastEnvioId - Id del ultimo envio del bloque procesado.
     */
    public async procesarExperiencia(
        estadosIniciales: Map<string, EstadoUsuario>,
        estadosFinales: Map<string, EstadoUsuario>,
        estadosFinalesPorMes: Map<number, Map<string, EstadoUsuario>>,
        nuevosLogros: Map<string, Set<Logro>>,
        nuevosLogrosPorMes: Map<number, Map<string, Set<Logro>>>,
        checkpointsStats: Map<string, number>,
        lastEnvioId: number
    ) {
        //se filtran las estadisticas cuyo checkpoint ya cubre el bloque (su XP ya esta contada)
        const estadisticasActivas = this.estadisticas.filter(estadistica => (checkpointsStats.get(estadistica.id) ?? 0) < lastEnvioId);

        //se registra la xp global del bloque
        await xpDAO.registrarBloqueXP(this.calcularXP(estadisticasActivas, estadosIniciales, estadosFinales, nuevosLogros));

        //se recorre cada mes para calcular su xp y persistir las estadisticas del mes
        const meses = [...estadosFinalesPorMes.keys()].sort((a, b) => a - b);
        const pipeline = usuarioDAO.iniciarPipeline();
        const bloquesMes: { mes: number, puntos: datosXP[] }[] = [];

        for (const mes of meses) {
            //los estados ya contienen solo el delta del mes, no el acumulado
            const deltasMes = estadosFinalesPorMes.get(mes)!;
            const nuevosLogrosMes = nuevosLogrosPorMes.get(mes) ?? new Map<string, Set<Logro>>();

            //la xp del mes se calcula directamente del delta
            bloquesMes.push({ mes, puntos: this.calcularXP(estadisticasActivas, new Map(), deltasMes, nuevosLogrosMes) });

            //se persisten las estadisticas del mes usando el delta
            for (const [usuario, deltaMes] of deltasMes) {
                const logrosMes = nuevosLogrosMes.get(usuario) ?? new Set<Logro>();

                for (const estadistica of estadisticasActivas)
                    estadistica.registrarMes(pipeline, usuario, mes, {}, deltaMes, logrosMes);

                logrosService.registrarMes(pipeline, usuario, mes, logrosMes);
            }
        }

        await xpDAO.registrarBloqueXPMes(bloquesMes);
        await pipeline.exec();
    }

    /**
     * Calcula la XP de cada usuario sumando la aportacion de las estadisticas indicadas.
     * @param estadisticas - Estadisticas que aportan XP en este calculo.
     * @param estadosIniciales - Mapa de estados de usuario antes del periodo.
     * @param estadosFinales - Mapa de estados de usuario al final del periodo.
     * @param nuevosLogros - Logros nuevos obtenidos por cada usuario en el periodo.
     * @returns Array de objetos { usuario, xp } con la XP calculada para cada usuario.
     */
    private calcularXP(
        estadisticas: EstadisticaExperiencia[],
        estadosIniciales: Map<string, EstadoUsuario>,
        estadosFinales: Map<string, EstadoUsuario>,
        nuevosLogros: Map<string, Set<Logro>>
    ): datosXP[] {
        const resultado: datosXP[] = [];
        for (const [usuario, estadoFinal] of estadosFinales) {
            
            const estadoInicial = estadosIniciales.get(usuario) ?? {} as EstadoUsuario;
            
            const logros = nuevosLogros.get(usuario) ?? new Set<Logro>();
            
            let xp = logrosService.calcularXP(logros);
            
            for (const est of estadisticas)
                xp += est.calcularXP(estadoInicial, estadoFinal, logros);
            resultado.push({ usuario, xp });
        }
        return resultado;
    }



    /**
     * Resetea todos los registros de la xp en la base de datos para todos los usuarios.
     */
    public async resetearXP() {
        await xpDAO.resetearXP();
    }

    /**
     * Borra los datos mensuales de cada estadistica registrada cuyo id este en `idsAfectados`,
     * para que se reconstruyan limpios al reprocesar los envios.
     * @param idsAfectados - Conjunto de ids de estadisticas que han cambiado de version.
     */
    public async borrarStatsMesReseteadas(idsAfectados: Set<string>): Promise<void> {
        for (const estadistica of this.estadisticas)
            if (idsAfectados.has(estadistica.id))
                await estadistica.borrarMes();
    }

    /**
     * Borra todos los datos asociados a un mes concreto: estadisticas mensuales,
     * logros mensuales y ranking de XP del mes. Se invoca al detectar que se ha
     * entrado en un nuevo mes natural para evitar que se mezclen datos de aniadas.
     * @param mes - Mes (0-11) cuyos datos se van a borrar.
     */
    public async borrarMesCompleto(mes: number): Promise<void> {
        for (const estadistica of this.estadisticas)
            await estadistica.borrarMesEspecifico(mes);
        await logrosService.borrarLogrosMes(mes);
        await xpDAO.borrarRankingMes(mes);
    }

    /**
     * Recalcula los rankings mensuales de XP a partir de los datos mensuales persistidos
     * de cada estadistica y de los logros. Sobrescribe los 12 rankings mensuales.
     */
    public async recalcularXPPorMes(): Promise<void> {
        for (let mes = 0; mes < 12; mes++) {
            const xpPorUsuario = new Map<string, number>();

            //se suman las aportaciones de cada estadistica para el mes
            for (const estadistica of this.estadisticas) {
                const aportes = await estadistica.calcularXPMes(mes);
                for (const [usuario, xp] of aportes)
                    xpPorUsuario.set(usuario, (xpPorUsuario.get(usuario) ?? 0) + xp);
            }

            //se suman las aportaciones de los logros para el mes
            const aportesLogros = await logrosService.calcularXPMes(mes);
            for (const [usuario, xp] of aportesLogros)
                xpPorUsuario.set(usuario, (xpPorUsuario.get(usuario) ?? 0) + xp);

            const datos: datosXP[] = [...xpPorUsuario].map(([usuario, xp]) => ({ usuario, xp }));
            await xpDAO.setRankingMes(mes, datos);
        }
    }

    /**
     * Recalcula el ranking global de XP a partir de los registros persistidos en la base de datos.
     * Se invoca tras borrar los campos de las estadisticas reseteadas: como sus datos persistidos
     * ya estan a 0, su aportacion es 0 automaticamente sin necesidad de filtrarlas.
     */
    public async recalcularXPGlobal(): Promise<void> {
        const usuarios = await usuarioDAO.getTodosUsuarios();
        if (usuarios.length === 0) {
            await xpDAO.setRankingGlobal([]);
            return;
        }

        //se cargan los estados actuales y los logros de cada usuario para reconstruir su XP
        const estados = await estadosService.getEstadosInicialesUsuarios(new Set(usuarios));
        const logrosPorUsuario = await logrosService.getLogros(usuarios);

        const datos: datosXP[] = usuarios.map(usuario => {
            const estado = estados.get(usuario) ?? {} as EstadoUsuario;
            const logros = logrosPorUsuario.get(usuario) ?? new Set<Logro>();
            const xpEstadisticas = this.estadisticas.reduce(
                (suma, est) => suma + est.calcularXP({} as EstadoUsuario, estado, logros),
                0
            );
            return { usuario, xp: xpEstadisticas + logrosService.calcularXP(logros) };
        });

        await xpDAO.setRankingGlobal(datos);
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
     * @returns Entero positivo. 
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
            if (xp < UmbralNivel.COMPETENTE) return NivelUsuario.APRENDIZ;
            if (xp < UmbralNivel.HABIL) return NivelUsuario.COMPETENTE;
            if (xp < UmbralNivel.ESPECIALISTA) return NivelUsuario.HABIL;
            if (xp < UmbralNivel.PROFESIONAL) return NivelUsuario.ESPECIALISTA;
            return NivelUsuario.PROFESIONAL;
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
            case NivelUsuario.APRENDIZ: return { iniXP: UmbralNivel.APRENDIZ, finXP: UmbralNivel.COMPETENTE-1 };
            case NivelUsuario.COMPETENTE: return { iniXP: UmbralNivel.COMPETENTE, finXP: UmbralNivel.HABIL-1 };
            case NivelUsuario.HABIL: return { iniXP: UmbralNivel.HABIL, finXP: UmbralNivel.ESPECIALISTA-1 };
            case NivelUsuario.ESPECIALISTA: return { iniXP: UmbralNivel.ESPECIALISTA, finXP: UmbralNivel.PROFESIONAL-1 };
            case NivelUsuario.PROFESIONAL: return { iniXP: UmbralNivel.PROFESIONAL, finXP: Number.MAX_VALUE };
            default: return { iniXP: Number.MIN_VALUE, finXP: Number.MAX_VALUE };
        }
    }

    /**
     * Devuelve la posicion del usuario en el ranking global.
     * @param usuario - Identificador del usuario.
     * @returns Entero positivo con la posicion en el ranking global.
     */
    async getPosUsuarioEnRanking(usuario: string): Promise<number> {
        return await xpDAO.getPosUsuarioEnRanking(usuario);
    }

}

export default new XPService();