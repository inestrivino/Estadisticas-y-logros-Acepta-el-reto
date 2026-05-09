import DAO from "./DAO.js";

class GestionDAO extends DAO {

    /**
     * Persiste el id del ultimo envio procesado.
     * @param ultimoEnvio - Id del envio.
     */
    public async setUltimoEnvio(ultimoEnvio: number) {
        await this.redis.set(`untimoEnvio`, ultimoEnvio);
    }

    /**
     * Recupera el id del ultimo envio procesado, o 0 si no hay ninguno.
     * @returns Id del ultimo envio procesado.
     */
    public async getUltimoEnvio(): Promise<number> {
        const ultimoEnvio = await this.redis.get(`untimoEnvio`);
        return ultimoEnvio ? Number(ultimoEnvio) : 0;
    }

    /**
     * Persiste el numero de la primera pagina procesada de la API.
     * @param primeraPagina - Numero de pagina.
     */
    public async setPrimeraPagina(primeraPagina: number) {
        await this.redis.set(`primeraPagina`, primeraPagina);
    }

    /**
     * Recupera el numero de la primera pagina procesada de la API.
     * @param primeraPagina - Numero de pagina.
     */
    public async getPrimeraPagina() {
        const primeraPagina = await this.redis.get(`primeraPagina`);
        return primeraPagina ? Number(primeraPagina) : 0;
    }

    /**
     * Persiste el numero de la ultima pagina procesada de la API.
     * @param ultimaPagina - Numero de pagina.
     */
    public async setUltimaPagina(ultimaPagina: number) {
        await this.redis.set(`ultimaPagina`, ultimaPagina);
    }

    /**
     * Recupera el numero de la ultima pagina procesada, o 0 si no hay ninguna.
     * @returns Numero de la ultima pagina procesada.
     */
    public async getUltimaPagina(): Promise<number> {
        const ultimaPagina = await this.redis.get(`ultimaPagina`);
        return ultimaPagina ? Number(ultimaPagina) : 0;
    }

    /**
     * Persiste el porcentaje de carga de envios completado.
     * @param porcentaje - Porcentaje de carga (0-100).
     */
    public async setPorcentajeCarga(porcentaje: number) {
        await this.redis.set(`porcentajeCarga`, porcentaje);
    }

    /**
     * Recupera el porcentaje de carga de envios completado, o 0 si no hay ninguno.
     * @returns Porcentaje de carga (0-100).
     */
    public async getPorcentajeCarga(): Promise<number> {
        const porcentaje = await this.redis.get(`porcentajeCarga`);
        return porcentaje ? Number(porcentaje) : 0;
    }

    //=============================== VERSIONES Y CHECKPOINTS ===============================

    /**
     * Devuelve la version aplicada de la estadistica indicada, o 0 si nunca se aplico.
     */
    public async getVersionStat(id: string): Promise<number> {
        const v = await this.redis.get(`meta:stat:${id}:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version aplicada de la estadistica indicada.
     */
    public async setVersionStat(id: string, version: number) {
        await this.redis.set(`meta:stat:${id}:version`, String(version));
    }

    /**
     * Devuelve el numero del ultimo envio procesado por la estadistica indicada, o 0 si ninguno.
     */
    public async getCheckpointStat(id: string): Promise<number> {
        const v = await this.redis.get(`meta:stat:${id}:envio`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste el numero del ultimo envio procesado por la estadistica indicada.
     */
    public async setCheckpointStat(id: string, envio: number) {
        await this.redis.set(`meta:stat:${id}:envio`, String(envio));
    }

    /**
     * Devuelve la version aplicada del logro indicado, o 0 si nunca se aplico.
     */
    public async getVersionLogro(id: string): Promise<number> {
        const v = await this.redis.get(`meta:logro:${id}:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version aplicada del logro indicado.
     */
    public async setVersionLogro(id: string, version: number) {
        await this.redis.set(`meta:logro:${id}:version`, String(version));
    }

    /**
     * Devuelve el numero del ultimo envio procesado por el logro indicado, o 0 si ninguno.
     */
    public async getCheckpointLogro(id: string): Promise<number> {
        const v = await this.redis.get(`meta:logro:${id}:envio`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste el numero del ultimo envio procesado por el logro indicado.
     */
    public async setCheckpointLogro(id: string, envio: number) {
        await this.redis.set(`meta:logro:${id}:envio`, String(envio));
    }

    /**
     * Devuelve la version de la aplicacion almacenada en Redis, o 0 si no hay ninguna.
     * @returns Version de la aplicacion.
     */
    public async getVersion(): Promise<number> {
        const v = await this.redis.get(`meta:app:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version de la aplicacion en Redis.
     * @param version - Version de la aplicacion.
     */
    public async setVersion(version: number) {
        await this.redis.set(`meta:app:version`, String(version));
    }

    /**
     * Elimina todos los datos de Redis.
     */
    public async flushAll() {
        await this.redis.flushAll();
    }

}

export default new GestionDAO();