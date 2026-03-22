import UsuarioDAO from "src/dao/usuarioDAO.js";
import ProblemaDAO from "src/dao/problemaDAO.js";
import redisClient from '../redis/redisClient.js';

type Envio = {
    envioId: number,
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
    envioId: number,
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

export async function cargarBloqueEnvios(envios: Envio[]) {

    //pongo cada envio del bloque con el formato correcto
    const enviosProcesados:EnvioProcesado[] = [];
    for (const envio of envios) {
        enviosProcesados.push(parseEnvio(envio));
    }

    //mete todas las operaciones en el pipeline
    const pipeline = redisClient.multi();
    for (const envio of enviosProcesados) {
        await procesarEnvio(envio, pipeline);
    }

    //ejecuta el pipeline
    await pipeline.exec();
}

export async function cargarEnvio(envio: Envio) {
    const envioProcesado = parseEnvio(envio);
    await procesarEnvio(envioProcesado);
}

function parseEnvio(envio: Envio):EnvioProcesado {
    const [anio, mes, dia] = envio.fecha.split('-').map(Number);

    let envioProcesado:EnvioProcesado = {
        envioId: envio.envioId,
        usuario: envio.usuario,
        problema: envio.problema,
        resultado: envio.resultado,
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

async function procesarEnvio(envio: EnvioProcesado, pipeline?: any) {
    const problemaDAO = new ProblemaDAO();
    const usuarioDAO = new UsuarioDAO();

    //actualiza la informacion del problema
    await problemaDAO.registrarDato(
        {
            problema: envio.problema,
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            tiempo: envio.tiempo
        },
        pipeline,
    );

    //actualiza la informacion del usuario
    //TODO poner aqui tambien el pipeline
    await usuarioDAO.registrarDato(
        {
            envioId: envio.envioId,
            usuario: envio.usuario,
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            fecha: envio.fecha
        },
        pipeline
    );
}