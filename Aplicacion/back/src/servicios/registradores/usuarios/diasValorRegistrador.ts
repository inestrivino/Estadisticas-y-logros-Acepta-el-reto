import { RegistradorUsuario } from '../usuarioRegistrador.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import usuarioDAO from '../../../dao/usuarioDAO.js';

const registradorDiasValor: RegistradorUsuario = {
    id: CampoUsuario.DIAS_VALOR,
    registrar: (pipeline, usuario, estado) => usuarioDAO.guardarDiasValor(pipeline, usuario, estado),
    borrar: () => usuarioDAO.borrarDiasValor(),
};

export default registradorDiasValor;
