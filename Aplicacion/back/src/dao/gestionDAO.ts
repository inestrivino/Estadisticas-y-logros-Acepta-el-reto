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

    //DEBUG
    //TODO
    /** Elimina todos los datos de Redis. Solo para uso en depuracion. */
    public async flushAll() {
        await this.redis.flushAll();
    }

}

export default new GestionDAO();