import { EstadoProblema } from "../../types/estados/estadoProblema.js";
import estadisticasProblemaBase from "./estadisticasProblemaBaseService.js";

class ProblemaService {

    public async registrarEstadosProblemas(estadosProblemas: Map<string, EstadoProblema>) {
        await estadisticasProblemaBase.registrarEstadosProblemas(estadosProblemas);
    }

}

export default new ProblemaService();
