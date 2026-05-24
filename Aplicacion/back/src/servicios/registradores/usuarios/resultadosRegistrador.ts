import { RegistradorUsuario } from '../usuarioRegistrador.js';
import { CampoUsuario } from '../../../types/estados/camposEstadoUsuario.js';
import usuarioDAO from '../../../dao/usuarioDAO.js';

const registradorResultados: RegistradorUsuario = {
    id: CampoUsuario.RESULTADOS,
    registrar: (pipeline, usuario, estado) => usuarioDAO.guardarResultados(pipeline, usuario, estado),
    borrar: (usuarios) => usuarioDAO.borrarResultados(usuarios),
};

export default registradorResultados;
