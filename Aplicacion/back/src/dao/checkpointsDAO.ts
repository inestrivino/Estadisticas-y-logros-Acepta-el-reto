import DAO from "./DAO.js";

class CheckpointsDAO extends DAO {

    //=============================== VERSIONES ===============================

    /**
     * Devuelve la version aplicada del calculador de estadisticas indicado, o 0 si nunca se aplico.
     * @param id - Identificador del calculador.
     */
    public async getVersionStat(id: string): Promise<number> {
        const v = await this.redis.get(`stat:${id}:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version aplicada del calculador de estadisticas indicado.
     * @param id - Identificador del calculador.
     * @param version - Version a persistir.
     */
    public async setVersionStat(id: string, version: number) {
        await this.redis.set(`stat:${id}:version`, String(version));
    }

    /**
     * Devuelve la version aplicada del calculador de XP indicado, o 0 si nunca se aplico.
     * @param id - Identificador del calculador de XP.
     */
    public async getVersionXP(id: string): Promise<number> {
        const v = await this.redis.get(`xp:${id}:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version aplicada del calculador de XP indicado.
     * @param id - Identificador del calculador de XP.
     * @param version - Version a persistir.
     */
    public async setVersionXP(id: string, version: number) {
        await this.redis.set(`xp:${id}:version`, String(version));
    }

    /**
     * Devuelve la version aplicada del logro indicado, o 0 si nunca se aplico.
     * @param id - Identificador del logro.
     */
    public async getVersionLogro(id: string): Promise<number> {
        const v = await this.redis.get(`logro:${id}:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version aplicada del logro indicado.
     * @param id - Identificador del logro.
     * @param version - Version a persistir.
     */
    public async setVersionLogro(id: string, version: number) {
        await this.redis.set(`logro:${id}:version`, String(version));
    }

    //=============================== CHECKPOINTS ===============================

    /**
     * Devuelve el numero del ultimo envio procesado por el calculador de estadisticas indicado, o 0 si ninguno.
     * @param id - Identificador del calculador.
     */
    public async getCheckpointStat(id: string): Promise<number> {
        const v = await this.redis.get(`stat:${id}:envio`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste el numero del ultimo envio procesado por el calculador de estadisticas indicado.
     * @param id - Identificador del calculador.
     * @param envio - Id del ultimo envio procesado.
     */
    public async setCheckpointStat(id: string, envio: number) {
        await this.redis.set(`stat:${id}:envio`, String(envio));
    }

    /**
     * Devuelve el numero del ultimo envio procesado por el logro indicado, o 0 si ninguno.
     * @param id - Identificador del logro.
     */
    public async getCheckpointLogro(id: string): Promise<number> {
        const v = await this.redis.get(`logro:${id}:envio`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste el numero del ultimo envio procesado por el logro indicado.
     * @param id - Identificador del logro.
     * @param envio - Id del ultimo envio procesado.
     */
    public async setCheckpointLogro(id: string, envio: number) {
        await this.redis.set(`logro:${id}:envio`, String(envio));
    }
}

export default new CheckpointsDAO();
