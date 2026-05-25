import gestionService from "./gestionService.js";
import checkpointsDAO from "../dao/checkpointsDAO.js";
import estadosService from "./estadosService.js";
import logrosService from "./logrosService.js";
import usuarioService from "./usuarioService.js";
import problemaService from "./problemaService.js";
import xpService from "./xpService.js";
import { Logro } from "./logros/logro.js";

class CheckpointsService {

    /**
     * Comprueba al arrancar la version de la aplicacion, de XP y de cada actualizador y logro.
     * Si la version de la app ha cambiado, limpia Redis por completo.
     * Si la version de XP o algun actualizador ha cambiado, resetea y recalcula la XP.
     * Si algun logro ha cambiado de version, resetea sus checkpoints y borra sus datos persistidos.
     */
    public async comprobarVersiones(): Promise<void> {

        await this.comprobarVersionApp();
        const resetearXpGlobal:boolean = await this.comprobarVersionXP();

        const camposResetearUsuarios = await this.comprobarVersionesStats(estadosService.getActualizadoresUsuarios());
        const camposResetearProblemas = await this.comprobarVersionesStats(estadosService.getActualizadoresProblemas());
        const logrosResetear = await this.comprobarVersionesLogros(logrosService.getDefiniciones(), camposResetearUsuarios, camposResetearProblemas);

        let reseteoRealizado = false;

        if (camposResetearUsuarios.size > 0) {
            await usuarioService.resetearCamposUsuarios(camposResetearUsuarios);
            reseteoRealizado = true;
        }

        if (camposResetearProblemas.size > 0) {
            await problemaService.resetearCamposProblemas(camposResetearProblemas);
            reseteoRealizado = true;
        }
            
        if (logrosResetear.size > 0) {
            await logrosService.borrarLogros(logrosResetear);
            reseteoRealizado = true;
        }

        //se delega en xpService el borrado mensual de las estadisticas afectadas que aportan XP
        //y se recalcula el ranking global ya sin la aportacion de las que se acaban de borrar
        if (camposResetearUsuarios.size > 0 || camposResetearProblemas.size > 0 || resetearXpGlobal) {
            await xpService.resetearXP();
            await xpService.borrarStatsMesReseteadas(new Set([...camposResetearUsuarios, ...camposResetearProblemas]));
            await xpService.recalcularXPGlobal();
            await xpService.recalcularXPPorMes();
            reseteoRealizado = true;
        }

        if (reseteoRealizado)
            await gestionService.resetContadorEnvios();
    }

    /**
     * Comprueba si se ha entrado en uno o mas meses naturales nuevos desde la ultima ejecucion.
     * Por cada mes atravesado, borra los datos mensuales de ese bucket (estadisticas, logros y XP)
     * para evitar que los acumulados de anios anteriores se mezclen con los del mes en curso.
     * Si han pasado 12 o mas meses.
     */
    public async comprobarMesActual(): Promise<void> {
        const ahora = new Date();
        const actual = ahora.getUTCFullYear() * 12 + ahora.getUTCMonth();
        const ultimo = await gestionService.getUltimoYearMonth();

        //primer arranque: solo se persiste el year-month actual, sin borrar nada
        if (ultimo === -1) {
            await gestionService.setUltimoYearMonth(actual);
            return;
        }

        const diff = actual - ultimo;
        if (diff <= 0) return;

        //si han pasado 12 meses o mas, todos los buckets estan obsoletos
        const mesesALimpiar = diff >= 12
            ? Array.from({ length: 12 }, (_, i) => i)
            : Array.from({ length: diff }, (_, i) => (ultimo + 1 + i) % 12);

        console.log(` * cambio de mes detectado: limpiando buckets ${mesesALimpiar.join(", ")}`);
        for (const mes of mesesALimpiar)
            await xpService.borrarMesCompleto(mes);

        await gestionService.setUltimoYearMonth(actual);
    }

    /**
     * Comprueba si la version de la aplicacion ha cambiado respecto a la almacenada.
     * Si es asi, elimina todos los datos de Redis y persiste la nueva version.
     */
    private async comprobarVersionApp(): Promise<void> {
        const currentVersion = Number(process.env.VERSION ?? 0);
        const storedVersion = await gestionService.getVersion();
        if (currentVersion > storedVersion || currentVersion === -1) {
            console.log(` * version detectada: ${currentVersion}, version almacenada: ${storedVersion}. Reiniciando Redis.`);
            await gestionService.flushAll();
            await gestionService.setVersion(currentVersion);
        }
    }

    /**
     * Comprueba si la version de XP del .env ha cambiado respecto a la almacenada en Redis.
     * @returns true si la version ha cambiado, false en caso contrario.
     */
    private async comprobarVersionXP(): Promise<boolean> {
        await checkpointsDAO.setVersionXP("xp", 1);
        const currentXpVersion = Number(process.env.XPVERSION ?? 0);
        const storedXpVersion = await checkpointsDAO.getVersionXP("xp");
        return (currentXpVersion !== storedXpVersion);
    }

    /**
     * Comprueba si algun calculador de estadisticas ha cambiado de version y resetea su checkpoint si es asi.
     * @param calculadores - Array de calculadores de estadisticas a comprobar.
     * @returns Conjunto de ids de calculadores cuya version ha cambiado.
     */
    private async comprobarVersionesStats(calculadores: { id: string, version: number }[]): Promise<Set<string>> {
        const camposResetear = new Set<string>();
        for (const calculador of calculadores) {
            const versionGuardada = await checkpointsDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                console.log(` - version cambiada en '${calculador.id}': ${versionGuardada} -> ${calculador.version}, reseteando checkpoint`);
                await checkpointsDAO.setVersionStat(calculador.id, calculador.version);
                await checkpointsDAO.setCheckpointStat(calculador.id, 0);
                camposResetear.add(calculador.id);
            }
        }
        return camposResetear;
    }

    /**
     * Comprueba si algun logro ha cambiado de version, resetea su checkpoint y lo reevalua si es asi.
     * Tambien resetea el checkpoint de las estadisticas de las que cuelga el logro y devuelve sus
     * ids para que el llamante borre los registros correspondientes de la base de datos.
     * @returns Conjuntos de ids de estadisticas de usuario y de problema cuyos registros hay que borrar.
     */
    private async comprobarVersionesLogros(
        logros: Logro[], 
        camposResetearUsuarios: Set<string>, 
        camposResetearProblemas: Set<string>
    ): Promise<Set<number>> {

        const logrosResetear = new Set<number>();

        for (const logro of logros) {

            //se comprueba si ha cambiado la version del logro
            const versionGuardada = await checkpointsDAO.getVersionLogro(logro.id);
            if (versionGuardada !== logro.version) {

                //si ha cambiado se actualiza la version en la base de datos
                console.log(` - version cambiada en logro '${logro.nombre}' (id: ${logro.id}): ${versionGuardada} -> ${logro.version}, reseteando checkpoint`);
                await checkpointsDAO.setVersionLogro(logro.id, logro.version);

                //se pone su checkpoint a 0 y se empieza la carga de envios
                await checkpointsDAO.setCheckpointLogro(logro.id, 0);

                //se resetean los checkpoints de las estadisticas de las que cuelga el logro
                //y se acumulan sus ids para que el llamante borre sus registros
                for (const id of logro.requiereEstadisticasUsuario) {
                    await checkpointsDAO.setCheckpointStat(id, 0);
                    camposResetearUsuarios.add(id);
                }
                for (const id of logro.requiereEstadisticasProblemas) {
                    await checkpointsDAO.setCheckpointStat(id, 0);
                    camposResetearProblemas.add(id);
                }

                //se marca el logro para borrar su registro de la base de datos
                logrosResetear.add(logro.id);
            }
        }

        return logrosResetear;
    }

    /**
     * Carga el checkpoint actual de cada calculador de estadisticas de usuario en un mapa por id.
     * Si la version guardada no coincide con la actual, resetea el checkpoint a 0.
     * @returns Mapa con el checkpoint actual de cada calculador de estadisticas de usuario.
     */
    public async cargarCheckpointsUsuarios(): Promise<Map<string, number>> {

        const checkpointsUsuarios = new Map<string, number>();

        for (const calculador of estadosService.getActualizadoresUsuarios()) {
            const versionGuardada = await checkpointsDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                await checkpointsDAO.setVersionStat(calculador.id, calculador.version);
                await checkpointsDAO.setCheckpointStat(calculador.id, 0);
            }
            checkpointsUsuarios.set(calculador.id, await checkpointsDAO.getCheckpointStat(calculador.id));
        }

        return checkpointsUsuarios;
    }

    /**
     * Carga el checkpoint actual de cada calculador de estadisticas de problema en un mapa por id.
     * Si la version guardada no coincide con la actual, resetea el checkpoint a 0.
     * @returns Mapa con el checkpoint actual de cada calculador de estadisticas de problema.
     */
    public async cargarCheckpointProblemas(): Promise<Map<string, number>> {

        const checkpointsProblemas = new Map<string, number>();

        for (const calculador of estadosService.getActualizadoresProblemas()) {
            const versionGuardada = await checkpointsDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                await checkpointsDAO.setVersionStat(calculador.id, calculador.version);
                await checkpointsDAO.setCheckpointStat(calculador.id, 0);
            }
            checkpointsProblemas.set(calculador.id, await checkpointsDAO.getCheckpointStat(calculador.id));
        }

        return checkpointsProblemas;

    }

    /**
     * Carga el checkpoint actual de cada logro registrado en un mapa por id.
     * @returns Mapa con el checkpoint actual de cada logro registrado.
     */
    public async cargarCheckpointsLogro(): Promise<Map<string, number>> {
        const checkpoints = new Map<string, number>();
        for (const logro of logrosService.getDefiniciones())
            checkpoints.set(String(logro.id), await checkpointsDAO.getCheckpointLogro(logro.id));
        return checkpoints;
    }

    /**
     * Avanza el checkpoint en Redis de cada stat y logro que quedo por detras del bloque
     * para que en el siguiente bloque se sigan filtrando correctamente.
     * @param checkpoints - Mapa con claves "usuarios", "problemas" y "logros", cada una con sus checkpoints por id.
     * @param lastEnvioId - Id del ultimo envio del bloque procesado.
     */
    public async avanzarCheckpoints(checkpoints: Map<string, Map<string, number>>, lastEnvioId: number) {
        for (const [tipo, mapa] of checkpoints) {
            for (const [id, cp] of mapa) {
                if (cp < lastEnvioId) {
                    await (tipo === "logros" ? checkpointsDAO.setCheckpointLogro(Number(id), lastEnvioId) : checkpointsDAO.setCheckpointStat(id, lastEnvioId));
                }
            }
        }
    }
}

export default new CheckpointsService();
