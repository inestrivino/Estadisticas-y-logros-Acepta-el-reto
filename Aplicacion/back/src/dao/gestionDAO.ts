import DAO from "./DAO.js";

class GestionDAO extends DAO {

    //TODO cambiar lo de los daos porque esto no tiene sentido dejarlo asi
    async registrarDirecto(dato: any): Promise<void> {
    }

    async agregarAlPipeline(dato: any, pipeline: any): Promise<void> {
    }

    public async setUltimoEnvio(ultimoEnvio: number) {
        await this.redis.set(`untimoEnvio`, ultimoEnvio);
    }

    public async getUltimoEnvio(): Promise<number> {
        const ultimoEnvio = await this.redis.get(`untimoEnvio`);
        return ultimoEnvio ? Number(ultimoEnvio) : 0;
    }

    public async setUltimaPagina(ultimaPagina: number) {
        await this.redis.set(`untimoPagina`, ultimaPagina);
    }

    public async getUltimaPagina(): Promise<number> {
        const untimoPagina = await this.redis.get(`untimoPagina`);
        return untimoPagina ? Number(untimoPagina) : 0;
    }

    //DEBUG 
    public async flushAll() {
        await this.redis.flushAll();
    }

}

export default new GestionDAO();