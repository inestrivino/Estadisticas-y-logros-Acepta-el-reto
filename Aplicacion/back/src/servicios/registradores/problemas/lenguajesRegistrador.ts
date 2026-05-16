import { RegistradorProblema } from '../problemaRegistrador.js';
import { CampoProblema } from '../../../types/estados/camposEstadoProblema.js';
import problemaDAO from '../../../dao/problemaDAO.js';

const registradorLenguajes: RegistradorProblema = {
    id: CampoProblema.LENGUAJES,
    registrar: (pipeline, problema, estado) => problemaDAO.guardarLenguajes(pipeline, problema, estado),
    borrar: () => problemaDAO.borrarLenguajes(),
};

export default registradorLenguajes;
