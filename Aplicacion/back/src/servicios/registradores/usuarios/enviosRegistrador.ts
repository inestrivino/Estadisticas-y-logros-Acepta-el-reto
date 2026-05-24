import { RegistradorUsuario } from '../usuarioRegistrador.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import usuarioDAO from '../../../dao/usuarioDAO.js';

const registradorEnvios: RegistradorUsuario = {
    id: CampoUsuario.NUM_ENVIOS,
    registrar: (pipeline, usuario, estado) => usuarioDAO.guardarEnvios(pipeline, usuario, estado),
    borrar: (usuarios) => usuarioDAO.borrarEnvios(usuarios),
};

export default registradorEnvios;
