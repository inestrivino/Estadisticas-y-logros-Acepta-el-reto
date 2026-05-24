import { RegistradorUsuario } from '../usuarioRegistrador.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import usuarioDAO from '../../../dao/usuarioDAO.js';

const registradorHoras: RegistradorUsuario = {
    id: CampoUsuario.HORAS,
    registrar: (pipeline, usuario, estado) => usuarioDAO.guardarHoras(pipeline, usuario, estado),
    borrar: (usuarios) => usuarioDAO.borrarHoras(usuarios),
};

export default registradorHoras;
