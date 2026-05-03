import { EstadoUsuario } from "../../types/estados/estadoUsuario.js";
import estadisticasUsuarioBase from "./estadisticasUsuarioBaseService.js";

class UsuarioService {

    public async registrarEstadosUsuarios(estadosUsuarios: Map<string, EstadoUsuario>) {
        await estadisticasUsuarioBase.registrarEstadosUsuarios(estadosUsuarios);
    }

}

export default new UsuarioService();