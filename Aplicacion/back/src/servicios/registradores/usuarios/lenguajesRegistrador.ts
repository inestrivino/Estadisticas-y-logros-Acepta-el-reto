import { RegistradorUsuario } from '../usuarioRegistrador.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import usuarioDAO from '../../../dao/usuarioDAO.js';

const registradorLenguajes: RegistradorUsuario = {
    id: CampoUsuario.LENGUAJES,
    registrar: (pipeline, usuario, estado) => usuarioDAO.guardarLenguajes(pipeline, usuario, estado),
    borrar: (usuarios) => usuarioDAO.borrarLenguajes(usuarios),
};

export default registradorLenguajes;
