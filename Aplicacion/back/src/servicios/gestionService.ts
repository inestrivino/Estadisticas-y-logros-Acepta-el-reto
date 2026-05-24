import gestionDAO from "../dao/gestionDAO.js";

class GestionService {

    /**
     * Reinicia el contador del ultimo envio procesado a 0.
     */
    public async resetContadorEnvios() {
        await gestionDAO.setUltimoEnvio(0);
    }

    /**
     * Actualiza el id del ultimo envio y el numero de la ultima pagina procesada.
     * El id de envio solo avanza: no se retrocede si el nuevo valor es menor que el actual.
     * @param ultimoEnvio - Id del ultimo envio procesado.
     * @param ultimaPagina - Numero de la ultima pagina procesada.
     */
    public async setUltimoEnvioYPagina(ultimoEnvio: number, ultimaPagina: number) {
        //ultimoEnvio es monotono: durante un recalculo se reprocesan envios antiguos
        //y no se debe retroceder el contador global
        const actual = await gestionDAO.getUltimoEnvio();
        if (ultimoEnvio > actual)
            await gestionDAO.setUltimoEnvio(ultimoEnvio);
        await gestionDAO.setUltimaPagina(ultimaPagina);
    }

    /**
     * Calcula y persiste el porcentaje de carga completado respecto a la primera pagina.
     * @param pagina - Numero de pagina actual en proceso.
     * @returns Porcentaje de carga completado (0-100).
     */
    public async calcularPorcentajeCarga(pagina: number) {
        const primeraPagina = await gestionDAO.getPrimeraPagina();
        const porcentaje = Math.round((primeraPagina - pagina) / primeraPagina * 100);

        await gestionDAO.setPorcentajeCarga(porcentaje);
        return porcentaje;
    }

    /**
     * Devuelve el id del ultimo envio procesado.
     * @returns Id del ultimo envio procesado.
     */
    public async getUltimoEnvio() {
        return await gestionDAO.getUltimoEnvio();
    }

    /**
     * Devuelve la version de la aplicacion almacenada en Redis.
     * @returns Version almacenada.
     */
    public async getVersion(): Promise<number> {
        return await gestionDAO.getVersion();
    }

    /**
     * Elimina todos los datos de Redis.
     */
    public async flushAll() {
        await gestionDAO.flushAll();
    }

    /**
     * Persiste la version actual de la aplicacion en Redis.
     * @param version - Version a guardar.
     */
    public async setVersion(version: number) {
        await gestionDAO.setVersion(version);
    }
}

export default new GestionService();
