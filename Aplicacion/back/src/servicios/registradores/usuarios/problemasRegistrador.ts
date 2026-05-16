import { RegistradorUsuario } from '../usuarioRegistrador.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import usuarioDAO from '../../../dao/usuarioDAO.js';

const registradorProblemas: RegistradorUsuario = {
    id: CampoUsuario.PROBLEMAS,
    registrar: (pipeline, usuario, estado) => usuarioDAO.guardarProblemas(pipeline, usuario, estado),
    borrar: () => usuarioDAO.borrarProblemas(),
};

export default registradorProblemas;
