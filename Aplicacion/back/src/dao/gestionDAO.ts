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
     * Devuelve la version aplicada del calculador o logro indicado, o 0 si nunca se aplico.
     * @param tipo - Prefijo del tipo: "stat" o "logro".
     * @param id - Identificador del calculador o logro.
     */
    public async getVersionCalc(tipo: string, id: string): Promise<number> {
        const v = await this.redis.get(`meta:${tipo}:${id}:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version aplicada del calculador o logro indicado.
     * @param tipo - Prefijo del tipo: "stat" o "logro".
     * @param id - Identificador del calculador o logro.
     * @param version - Version a persistir.
     */
    public async setVersionCalc(tipo: string, id: string, version: number) {
        await this.redis.set(`meta:${tipo}:${id}:version`, String(version));
    }

    /**
     * Devuelve el numero del ultimo envio procesado por el calculador o logro indicado, o 0 si ninguno.
     * @param tipo - Prefijo del tipo: "stat" o "logro".
     * @param id - Identificador del calculador o logro.
     */
    public async getCheckpointCalc(tipo: string, id: string): Promise<number> {
        const v = await this.redis.get(`meta:${tipo}:${id}:envio`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste el numero del ultimo envio procesado por el calculador o logro indicado.
     * @param tipo - Prefijo del tipo: "stat" o "logro".
     * @param id - Identificador del calculador o logro.
     * @param envio - Id del ultimo envio procesado.
     */
    public async setCheckpointCalc(tipo: string, id: string, envio: number) {
        await this.redis.set(`meta:${tipo}:${id}:envio`, String(envio));
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