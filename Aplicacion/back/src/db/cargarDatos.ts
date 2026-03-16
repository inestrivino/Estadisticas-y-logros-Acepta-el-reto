import UsuarioDAO from "src/dao/usuarioDAO.js";
import ProblemaDAO from "../dao/problemaDAO.js";

type Envio = {
    usuario: string,
    problema: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: string
};

type EnvioProcesado = {
    usuario: string,
    problema: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: {
        dia: number,
        mes: number,
        anio: number
    }
};

export async function cargarDatos(envio: Envio) {
    const envioProcesado = parseEnvio(envio);
    procesarEnvio(envioProcesado);
}

function parseEnvio(envio: Envio):EnvioProcesado {
    const [anio, mes, dia] = envio.fecha.split('-').map(Number);

    let envioProcesado:EnvioProcesado = {
        usuario: envio.usuario,
        problema: envio.problema,
        resultado: envio.problema,
        lenguaje: envio.lenguaje,
        tiempo: envio.tiempo,
        memoria: envio.memoria, //TODO diria que esto no lo usamos en ningun momento
        pos: envio.pos, //TODO diria que esto tampoco
        fecha: {
            dia: dia,
            mes: mes,
            anio: anio
        }
    };

    return envioProcesado;
}

async function procesarEnvio(envio: EnvioProcesado) {
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
        fecha: envio.fecha
    });
}