import gestionDAO from "../dao/gestionDAO.js";
import estadosService from "./estadosService.js";
import gestionService from "./gestionService.js";
import logrosService from "./logrosService.js";
import usuarioService from "./usuarioService.js";
import problemaService from "./problemaService.js";
import xpService from "./xpService.js";

class CheckpointsService {

    /**
     * Comprueba al arrancar si algun actualizador ha cambiado de version o es nuevo.
     * Si es asi, resetea su checkpoint a 0 para que reprocese desde el principio
     * y resetea el contador de envios para que se reinicie la carga de envios.
     */
    public async comprobarVersiones(): Promise<void> {
        const { calculadoresUsuario, calculadoresProblema } = estadosService.getActualizadores();

        const camposResetearUsuarios = new Set<string>();
        const camposResetearProblemas = new Set<string>();

        for (const calculador of calculadoresUsuario) {
            const versionGuardada = await gestionDAO.getVersionCalc("stat", calculador.id);
            if (versionGuardada !== calculador.version) {
                console.log(` - version cambiada en '${calculador.id}': ${versionGuardada} -> ${calculador.version}, reseteando checkpoint`);
                await gestionDAO.setVersionCalc("stat", calculador.id, calculador.version);
                await gestionDAO.setCheckpointCalc("stat", calculador.id, 0);
                await gestionService.resetContadorEnvios();
                camposResetearUsuarios.add(calculador.id);
            }
        }

        for (const calculador of calculadoresProblema) {
            const versionGuardada = await gestionDAO.getVersionCalc("stat", calculador.id);
            if (versionGuardada !== calculador.version) {
                console.log(` - version cambiada en '${calculador.id}': ${versionGuardada} -> ${calculador.version}, reseteando checkpoint`);
                await gestionDAO.setVersionCalc("stat", calculador.id, calculador.version);
                await gestionDAO.setCheckpointCalc("stat", calculador.id, 0);
                await gestionService.resetContadorEnvios();
                camposResetearProblemas.add(calculador.id);
            }
        }

        if (camposResetearUsuarios.size > 0)
            await usuarioService.resetearCamposUsuarios(camposResetearUsuarios);

        if (camposResetearProblemas.size > 0)
            await problemaService.resetearCamposProblemas(camposResetearProblemas);

        //se comprueba si uno de los campos reseteados afecta a la experiencia y hay que resetearla
        this.comprobacionReseteoXP(camposResetearUsuarios);
    }

    //TODO poner jsdoc y ver que hacer si recalcular todas las estadisticas que tengan que ver con la experiencia o no
    private comprobacionReseteoXP(camposResetearUsuarios:Set<string>) {
        const ids = xpService.actualizadoresIDs();

        for (const id of ids) {
            if (camposResetearUsuarios.has(id)) 
                xpService.resetearXP();
        }

        camposResetearUsuarios.add
    }

    /**
     * Carga el checkpoint actual de cada calculador (usuario y problema) en un mapa por id.
     * @returns Objeto con los checkpoints de usuarios y problemas.
     */
    public async cargarCheckpointsStat(): Promise<{ checkpointsUsuarios: Map<string, number>; checkpointsProblemas: Map<string, number> }> {

        const checkpointsUsuarios = new Map<string, number>();
        const checkpointsProblemas = new Map<string, number>();

        const { calculadoresUsuario, calculadoresProblema } = estadosService.getActualizadores();

        for (const calculador of calculadoresUsuario) {
            const versionGuardada = await gestionDAO.getVersionCalc("stat", calculador.id);
            if (versionGuardada !== calculador.version) {
                await gestionDAO.setVersionCalc("stat", calculador.id, calculador.version);
                await gestionDAO.setCheckpointCalc("stat", calculador.id, 0);
            }
            checkpointsUsuarios.set(calculador.id, await gestionDAO.getCheckpointCalc("stat", calculador.id));
        }

        for (const calculador of calculadoresProblema) {
            const versionGuardada = await gestionDAO.getVersionCalc("stat", calculador.id);
            if (versionGuardada !== calculador.version) {
                await gestionDAO.setVersionCalc("stat", calculador.id, calculador.version);
                await gestionDAO.setCheckpointCalc("stat", calculador.id, 0);
            }
            checkpointsProblemas.set(calculador.id, await gestionDAO.getCheckpointCalc("stat", calculador.id));
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
            checkpoints.set(logro.nombre, await gestionDAO.getCheckpointCalc("logro", logro.nombre));
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
                    await gestionDAO.setCheckpointCalc(tipo === "logros" ? "logro" : "stat", id, lastEnvioId);
                }
            }
        }
    }
}

export default new CheckpointsService();
