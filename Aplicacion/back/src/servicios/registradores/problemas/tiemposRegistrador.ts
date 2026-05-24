import { RegistradorProblema } from '../problemaRegistrador.js';
import { CampoProblema } from '../../../types/estados/camposEstadoProblema.js';
import problemaDAO from '../../../dao/problemaDAO.js';

const registradorTiempos: RegistradorProblema = {
    id: CampoProblema.TIEMPOS,
    registrar: (pipeline, problema, estado) => problemaDAO.guardarTiempos(pipeline, problema, estado),
    borrar: (problemas) => problemaDAO.borrarTiempos(problemas),
};

export default registradorTiempos;
