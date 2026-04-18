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
     * Persiste el numero de la ultima pagina procesada de la API.
     * @param ultimaPagina - Numero de pagina.
     */
    public async setUltimaPagina(ultimaPagina: number) {
        await this.redis.set(`untimoPagina`, ultimaPagina);
    }

    /**
     * Recupera el numero de la ultima pagina procesada, o 0 si no hay ninguna.
     * @returns Numero de la ultima pagina procesada.
     */
    public async getUltimaPagina(): Promise<number> {
        const untimoPagina = await this.redis.get(`untimoPagina`);
        return untimoPagina ? Number(untimoPagina) : 0;
    }

    //DEBUG
    /** Elimina todos los datos de Redis. Solo para uso en depuracion. */
    public async flushAll() {
        await this.redis.flushAll();
    }

}

export default new GestionDAO();