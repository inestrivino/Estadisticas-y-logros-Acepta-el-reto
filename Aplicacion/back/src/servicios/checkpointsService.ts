import gestionDAO from "../dao/gestionDAO.js";
import estadosService from "./estadosService.js";
import gestionService from "./gestionService.js";
import logrosService from "./logros/logrosService.js";
import usuarioService from "./usuarioService.js";
import problemaService from "./problemaService.js";

class CheckpointsService {

    /**
     * Comprueba al arrancar si algun actualizador ha cambiado de version o es nuevo.
     * Si es asi, resetea su checkpoint a 0 para que reprocese desde el principio
     * y resetea el contador de envios para que se reinicie la carga de envios.
     */
    public async comprobarVersiones(): Promise<void> {
        const { calculadoresUsuario, calculadoresProblema } = estadosService.getActualizadores();

        const idsUsuarioCambiados = new Set<string>();
        const idsProblemasCambiados = new Set<string>();

        for (const calculador of calculadoresUsuario) {
            const versionGuardada = await gestionDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                console.log(` - version cambiada en '${calculador.id}': ${versionGuardada} -> ${calculador.version}, reseteando checkpoint`);
                await gestionDAO.setVersionStat(calculador.id, calculador.version);
                await gestionDAO.setCheckpointStat(calculador.id, 0);
                await gestionService.resetContadorEnvios();
                idsUsuarioCambiados.add(calculador.id);
            }
        }

        for (const calculador of calculadoresProblema) {
            const versionGuardada = await gestionDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                console.log(` - version cambiada en '${calculador.id}': ${versionGuardada} -> ${calculador.version}, reseteando checkpoint`);
                await gestionDAO.setVersionStat(calculador.id, calculador.version);
                await gestionDAO.setCheckpointStat(calculador.id, 0);
                await gestionService.resetContadorEnvios();
                idsProblemasCambiados.add(calculador.id);
            }
        }

        if (idsUsuarioCambiados.size > 0)
            await usuarioService.borrarEstadosUsuarios(idsUsuarioCambiados);

        if (idsProblemasCambiados.size > 0)
            await problemaService.borrarEstadosProblemas(idsProblemasCambiados);
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
            const versionGuardada = await gestionDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                await gestionDAO.setVersionStat(calculador.id, calculador.version);
                await gestionDAO.setCheckpointStat(calculador.id, 0);
            }
            checkpointsUsuarios.set(calculador.id, await gestionDAO.getCheckpointStat(calculador.id));
        }

        for (const calculador of calculadoresProblema) {
            const versionGuardada = await gestionDAO.getVersionStat(calculador.id);
            if (versionGuardada !== calculador.version) {
                await gestionDAO.setVersionStat(calculador.id, calculador.version);
                await gestionDAO.setCheckpointStat(calculador.id, 0);
            }
            checkpointsProblemas.set(calculador.id, await gestionDAO.getCheckpointStat(calculador.id));
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
            checkpoints.set(logro.nombre, await gestionDAO.getCheckpointLogro(logro.nombre));
        return checkpoints;
    }

    /**
     * Avanza el checkpoint en Redis de cada stat y logro que quedo por detras del bloque
     * para que en el siguiente bloque se sigan filtrando correctamente.
     */
    public async avanzarCheckpoints(
        checkpointsStat: Map<string, number>,
        checkpointsLogro: Map<string, number>,
        lastEnvioId: number
    ) {
        for (const [id, cp] of checkpointsStat)
            if (cp < lastEnvioId)
                await gestionDAO.setCheckpointStat(id, lastEnvioId);

        for (const [nombre, cp] of checkpointsLogro)
            if (cp < lastEnvioId)
                await gestionDAO.setCheckpointLogro(nombre, lastEnvioId);
    }
}

export default new CheckpointsService();
