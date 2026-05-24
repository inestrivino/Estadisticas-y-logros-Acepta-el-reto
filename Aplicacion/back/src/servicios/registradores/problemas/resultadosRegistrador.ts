import { RegistradorProblema } from '../problemaRegistrador.js';
import { CampoProblema } from '../../../types/estados/camposEstadoProblema.js';
import problemaDAO from '../../../dao/problemaDAO.js';

const registradorResultados: RegistradorProblema = {
    id: CampoProblema.RESULTADOS,
    registrar: (pipeline, problema, estado) => problemaDAO.guardarResultados(pipeline, problema, estado),
    borrar: (problemas) => problemaDAO.borrarResultados(problemas),
};

export default registradorResultados;
