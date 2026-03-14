import UsuarioDAO from "src/dao/usuarioDAO.js";
import ProblemaDAO from "../dao/problemaDAO.js";

type Envio = {
    "usuario": string,
    "problema": string,
    "resultado": string,
    "lenguaje": string,
    "tiempo": number,
    "memoria": number,
    "pos": number,
    "fecha": string
};

export async function procesarEnvio(envio: Envio) {
    const problemaDAO = new ProblemaDAO();
    const usuarioDAO = new UsuarioDAO();

    //actualiza la informacion del problema
    await problemaDAO.registrarDatosProblema({
        problema: envio.problema,
        resultado: envio.resultado,
        lenguaje: envio.lenguaje,
        tiempo: envio.tiempo
    });

    //actualiza la informacion del usuario
    await usuarioDAO.registrarDatosUsuario({
        usuario: envio.usuario,
        resultado: envio.resultado,
        lenguaje: envio.lenguaje, 
    });
}