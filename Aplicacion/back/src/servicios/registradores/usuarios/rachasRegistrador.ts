import { RegistradorUsuario } from '../usuarioRegistrador.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import usuarioDAO from '../../../dao/usuarioDAO.js';

const registradorRachas: RegistradorUsuario = {
    id: CampoUsuario.RACHAS,
    registrar: (pipeline, usuario, estado) => usuarioDAO.guardarRachas(pipeline, usuario, estado),
    borrar: (usuarios) => usuarioDAO.borrarRachas(usuarios),
};

export default registradorRachas;
