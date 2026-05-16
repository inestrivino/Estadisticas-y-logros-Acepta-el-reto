import gestionService from "./gestionService.js";
import checkpointsDAO from "../dao/checkpointsDAO.js";
import estadosService from "./estadosService.js";
import logrosService from "./logrosService.js";
import usuarioService from "./usuarioService.js";
import problemaService from "./problemaService.js";

class CheckpointsService {

    /**
     * Comprueba al arrancar si algun actualizador ha cambiado de version o es nuevo.
     * Si es asi, resetea su checkpoint a 0 para que reprocese desde el principio
     * y resetea el contador de envios para que se reinicie la carga de envios.
     */
    public async comprobarVersiones(): Promise<void> {

        const camposResetearUsuarios = await this.comprobarVersionesStats(estadosService.getActualizadoresUsuarios());
        const camposResetearProblemas = await this.comprobarVersionesStats(estadosService.getActualizadoresProblemas());

        const { camposUsuariosLogros, camposProblemasLogros } = await this.comprobarVersionesLogros();
        for (const id of camposUsuariosLogros) camposResetearUsuarios.add(id);
        for (const id of camposProblemasLogros) camposResetearProblemas.add(id);

        if (camposResetearUsuarios.size > 0)
            await usuarioService.resetearCamposUsuarios(camposResetearUsuarios);

        if (camposResetearProblemas.size > 0)
            await problemaService.resetearCamposProblemas(camposResetearProblemas);
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
                await gestionService.resetContadorEnvios();
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
    private async comprobarVersionesLogros(): Promise<{ camposUsuariosLogros: Set<string>, camposProblemasLogros: Set<string> }> {

        const camposUsuariosLogros = new Set<string>();
        const camposProblemasLogros = new Set<string>();
        const logrosABorrar = new Set<string>();

        for (const logro of logrosService.getDefiniciones()) {

            //se comprueba si ha cambiado la version del logro
            const versionGuardada = await checkpointsDAO.getVersionLogro(logro.nombre);
            if (versionGuardada !== logro.version) {

                //si ha cambiado se actualiza la version en la base de datos
                console.log(` - version cambiada en logro '${logro.nombre}': ${versionGuardada} -> ${logro.version}, reseteando checkpoint`);
                await checkpointsDAO.setVersionLogro(logro.nombre, logro.version);

                //se pone su checkpoint a 0 y se empieza la carga de envios
                await checkpointsDAO.setCheckpointLogro(logro.nombre, 0);

                //se resetean los checkpoints de las estadisticas de las que cuelga el logro
                //y se acumulan sus ids para que el llamante borre sus registros
                for (const id of logro.requiereEstadisticasUsuario) {
                    await checkpointsDAO.setCheckpointStat(id, 0);
                    camposUsuariosLogros.add(id);
                }
                for (const id of logro.requiereEstadisticasProblemas) {
                    await checkpointsDAO.setCheckpointStat(id, 0);
                    camposProblemasLogros.add(id);
                }

                //se marca el logro para borrar su registro de la base de datos
                logrosABorrar.add(logro.nombre);
            }
        }

        //si algun logro cambio de version se borran sus registros y se reinicia la carga de envios
        if (logrosABorrar.size > 0) {
            await logrosService.borrarLogros(logrosABorrar);
            await gestionService.resetContadorEnvios();
        }

        return { camposUsuariosLogros, camposProblemasLogros };
    }

    /**
     * Carga el checkpoint actual de cada calculador (usuario y problema) en un mapa por id.
     * @returns Objeto con los checkpoints de usuarios y problemas.
     */
    public async cargarCheckpointsStat(): Promise<{ checkpointsUsuarios: Map<string, number>; checkpointsProblemas: Map<string, number> }> {

        const checkpointsUsuarios = new Map<string, number>();
        const checkpointsProblemas = new Map<string, number>();

        for (const calculador of estadosService.getActualizadoresUsuarios()) {
            const versionGuardada = await checkpointsDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                await checkpointsDAO.setVersionStat(calculador.id, calculador.version);
                await checkpointsDAO.setCheckpointStat(calculador.id, 0);
            }
            checkpointsUsuarios.set(calculador.id, await checkpointsDAO.getCheckpointStat(calculador.id));
        }

        for (const calculador of estadosService.getActualizadoresProblemas()) {
            const versionGuardada = await checkpointsDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                await checkpointsDAO.setVersionStat(calculador.id, calculador.version);
                await checkpointsDAO.setCheckpointStat(calculador.id, 0);
            }
            checkpointsProblemas.set(calculador.id, await checkpointsDAO.getCheckpointStat(calculador.id));
        }

        return { checkpointsUsuarios, checkpointsProblemas };
    }

    /**
     * Carga el checkpoint actual de cada logro registrado en un mapa por nombre.
     * @returns Mapa con el checkpoint actual de cada logro registrado.
     */
    public async cargarCheckpointsLogro(): Promise<Map<string, number>> {
        const checkpoints = new Map<string, number>();
        for (const logro of logrosService.getDefiniciones())
            checkpoints.set(logro.nombre, await checkpointsDAO.getCheckpointLogro(logro.nombre));
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
                    await (tipo === "logros" ? checkpointsDAO.setCheckpointLogro(id, lastEnvioId) : checkpointsDAO.setCheckpointStat(id, lastEnvioId));
                }
            }
        }
    }
}

export default new CheckpointsService();
