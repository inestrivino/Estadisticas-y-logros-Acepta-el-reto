import gestionDAO from "../dao/gestionDAO.js";

class GestionService {

    public async setUltimoEnvioYPagina(ultimoEnvio: number, ultimaPagina: number) {
        await gestionDAO.setUltimoEnvio(ultimoEnvio);
        await gestionDAO.setUltimaPagina(ultimaPagina);
    }

    public async calcularPorcentajeCarga(pagina: number) {
        const primeraPagina = await gestionDAO.getPrimeraPagina();
        const porcentaje = Math.round((primeraPagina - pagina) / primeraPagina * 100);

        await gestionDAO.setPorcentajeCarga(porcentaje);
        return porcentaje;
    }
    
    public async getUltimoEnvio() {
        return await gestionDAO.getUltimoEnvio();
    }
}

export default new GestionService();