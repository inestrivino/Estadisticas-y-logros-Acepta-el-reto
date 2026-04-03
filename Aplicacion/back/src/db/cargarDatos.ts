import UsuarioDAO from "src/dao/usuarioDAO.js";
import ProblemaDAO from "src/dao/problemaDAO.js";
import redisClient from '../redis/redisClient.js';
import EstadoServicio from "src/servicios/estado/EstadoServicio.js";
import { EstadoUsuario } from "src/servicios/estado/EstadoUsuario.js";
import ServicioLogro from "src/servicios/logros/ServicioLogro.js";

type Envio = {
    envioId: number,
    usuario: string,
    problema: string,
    categoria: string,
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
    categoria: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: {
        dia: number,
        mes: number,
        anio: number,
        hora: number
    }
};

export async function cargarBloqueEnvios(envios: Envio[]) {

    //pongo cada envio del bloque con el formato correcto
    const enviosProcesados: EnvioProcesado[] = [];
    for (const envio of envios) {
        enviosProcesados.push(parseEnvio(envio));
    }

    //mete todas las operaciones en el pipeline
    const pipeline = redisClient.multi();
    for (const envio of enviosProcesados) {
        const estado = EstadoServicio.getEstado(envio.usuario);
        actualizarEstado(estado, envio);

        await procesarEnvio(envio, pipeline, "cargaIni");
    }

    //ejecuta el pipeline
    await pipeline.exec();
}

export async function cargarEnvio(envio: Envio) {
    const envioProcesado = parseEnvio(envio);
    await procesarEnvio(envioProcesado, undefined, "tiempoReal");
}

function parseEnvio(envio: Envio): EnvioProcesado {
    const [fecha, horaStr] = envio.fecha.split('T');
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const hora = Number(horaStr.split(':')[0]);

    let envioProcesado: EnvioProcesado = {
        envioId: envio.envioId,
        usuario: envio.usuario,
        problema: envio.problema,
        categoria: envio.categoria,
        resultado: envio.resultado,
        lenguaje: envio.lenguaje,
        tiempo: envio.tiempo,
        memoria: envio.memoria, //TODO diria que esto no lo usamos en ningun momento
        pos: envio.pos, //TODO diria que esto tampoco
        fecha: {
            dia: dia,
            mes: mes,
            anio: anio,
            hora: hora
        }
    };

    return envioProcesado;
}

async function procesarEnvio(envio: EnvioProcesado, pipeline?: any, modo: "cargaIni" | "tiempoReal" = "tiempoReal") {
    const problemaDAO = new ProblemaDAO();
    const usuarioDAO = new UsuarioDAO();

    //actualiza la informacion del problema
    await problemaDAO.registrarDato(
        {
            envioId: envio.envioId,
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
            problema: envio.problema,
            categoria: envio.categoria,
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            fecha: envio.fecha
        },
        pipeline
    );

    if(modo === "tiempoReal") {
        const logrosNuevos = await ServicioLogro.procesarLogrosTiempoReal(envio);
        usuarioDAO.guardarLogros(envio.usuario, logrosNuevos);
    }
}

// Para la parte de actualizacion de los logros en la carga inicial, primero se guardara la informacion necesaria
//  en memoria para poder acceder a ella mas rapidamente. Esta funcion actualiza los datos en memoria tras un envio
function actualizarEstado(estado: EstadoUsuario, envio: EnvioProcesado) {
    estado.numEnvios++;
    estado.franjasHorarias.add(envio.fecha.hora);
    estado.lenguajes.add(envio.lenguaje);

    const ultimoDiaEnvio: string = estado.ultimoDiaEnvio || "";
    const strFecha: string = `${envio.fecha.dia.toString().padStart(2, '0')}-${envio.fecha.mes.toString().padStart(2, '0')}-${envio.fecha.anio}`;
    if (ultimoDiaEnvio !== strFecha) {
        const [dia, mes, anio] = estado.ultimoDiaEnvio?.split('-').map(Number) || [1, 1, 1]; //TODO mirar esto mejor
        const fechaAnterior = new Date(anio, mes - 1, dia);
        const fechaEnvio = new Date(envio.fecha.anio, envio.fecha.mes - 1, envio.fecha.dia);
        const timepoEntreFechas = (fechaEnvio.valueOf() - fechaAnterior.valueOf()) / 1000;
        
        if (timepoEntreFechas === 86400) { // si las fechas son de dias consecutivos aumentamos la racha
            estado.rachaDiasEnvio++;
            const rachaMax = estado.rachaDiasEnvioMax || 0;
            if (estado.rachaDiasEnvio > rachaMax) {
                estado.rachaDiasEnvioMax = estado.rachaDiasEnvio;
            }
        } else if (timepoEntreFechas > 86400) { //si la diferencia es mayor significa que se ha perdido la racha de dias
            estado.rachaDiasEnvio = 1;
        }
        estado.ultimoDiaEnvio = strFecha;

    }
    if (envio.resultado === "AC") {
        estado.rachaEnviosAC++;
        const rachaMax = estado.rachaEnviosACMax || 0;
        if (estado.rachaEnviosAC > rachaMax) {
            estado.rachaEnviosACMax = estado.rachaEnviosAC;
        }
        estado.categoriaProblemasResueltos.add(envio.categoria) //TODO envio.categoria solo existe en esta rama por ahora
        const numProblemasLeng: number = (estado.lenguajesProblemasResueltos.get(envio.lenguaje) || 0) + 1;
        estado.lenguajesProblemasResueltos.set(envio.lenguaje, numProblemasLeng);
    } else {
        estado.rachaEnviosAC = 0;
    }
}