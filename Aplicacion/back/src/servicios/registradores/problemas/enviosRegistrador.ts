import { RegistradorProblema } from '../problemaRegistrador.js';
import { CampoProblema } from '../../../types/estados/camposEstadoProblema.js';
import problemaDAO from '../../../dao/problemaDAO.js';

const registradorEnvios: RegistradorProblema = {
    id: CampoProblema.ENVIOS,
    registrar: (pipeline, problema, estado) => problemaDAO.guardarEnvios(pipeline, problema, estado),
    borrar: (problemas) => problemaDAO.borrarEnvios(problemas),
};

export default registradorEnvios;
