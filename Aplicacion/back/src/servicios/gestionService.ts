import gestionDAO from "../dao/gestionDAO.js";

class InicializarService {
    //TODO rellenar este servicio en vez de llamar directamente al dao

    public async getUltimoEnvio() {
        return await gestionDAO.getUltimoEnvio();
    }
}

export default new InicializarService();