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

    //=============================== VERSIONES ===============================

    /**
     * Devuelve la version de la aplicacion almacenada en Redis, o 0 si no hay ninguna.
     * @returns Version de la aplicacion.
     */
    public async getVersion(): Promise<number> {
        const v = await this.redis.get(`app:version`);
        return v ? Number(v) : 0;
    }

    /**
     * Persiste la version de la aplicacion en Redis.
     * @param version - Version de la aplicacion.
     */
    public async setVersion(version: number) {
        await this.redis.set(`app:version`, String(version));
    }

    /**
     * Elimina todos los datos de Redis.
     */
    public async flushAll() {
        await this.redis.flushAll();
    }

    //=============================== MES ACTUAL ===============================

    /**
     * Recupera el ultimo year-month (anio*12 + mes) en el que se proceso un envio,
     * o -1 si no hay valor almacenado.
     * @returns Entero anio*12 + mes, o -1 si no hay valor.
     */
    public async getUltimoYearMonth(): Promise<number> {
        const v = await this.redis.get(`gestion:ultimoYearMonth`);
        return v !== null ? Number(v) : -1;
    }

    /**
     * Persiste el ultimo year-month (anio*12 + mes) en el que se proceso un envio.
     * @param valor - Entero anio*12 + mes.
     */
    public async setUltimoYearMonth(valor: number): Promise<void> {
        await this.redis.set(`gestion:ultimoYearMonth`, String(valor));
    }

}

export default new GestionDAO();