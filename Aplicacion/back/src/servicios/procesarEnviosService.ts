import usuarioDAO from "../dao/usuarioDAO.js";
import problemaDAO from "../dao/problemaDAO.js";
import redisClient from '../redis/redisClient.js';
import EstadoServicio from "../servicios/estado/EstadoServicio.js";
import { EstadoUsuario } from "../servicios/estado/EstadoUsuario.js";
import ServicioLogro from "../servicios/logros/ServicioLogro.js";
import { EnvioSinProcesar } from "../types/envioSinProcesar.js";
import { EnvioProcesado } from "../types/envioProcesado.js";
import { EstadoProblema } from "./estado/estadoProblema.js";
import gestionDAO from "../dao/gestionDAO.js";

export async function cargarBloqueEnvios(bloque: {envio: EnvioSinProcesar, numPagina: number}[]) {

    //pongo cada envio del bloque con el formato correcto
    const enviosProcesados: EnvioProcesado[] = [];
    for (const data of bloque) {
        enviosProcesados.push(parseEnvio(data.envio));
    }

    //mete todas las operaciones en el pipeline
    const pipeline = redisClient.multi();
    for (const envio of enviosProcesados) {
        const estadoUsuario = EstadoServicio.getEstadoUsuario(envio.usuario);
        const estadoProblema = EstadoServicio.getEstadoProblema(envio.problema);
        await actualizarEstado(estadoUsuario, estadoProblema, envio);

        await procesarEnvio(envio, pipeline, "cargaInicial");
    }

    //ejecuta el pipeline
    await pipeline.exec();

    //marca cual es ahora el ultimo envio procesado y la ultima pagina donde estaba
    await gestionDAO.setUltimoEnvio(enviosProcesados[enviosProcesados.length - 1].envioId);
    await gestionDAO.setUltimaPagina(bloque[bloque.length - 1].numPagina);
    console.log(" + Bloque insertado en la base de datos\n");

}

export async function cargarEnvio(envio: EnvioSinProcesar) {
    console.log("Carga un envio individual");
    const envioProcesado = parseEnvio(envio);
    await procesarEnvio(envioProcesado, undefined, "envioIndividual");
}

function parseEnvio(envio: EnvioSinProcesar): EnvioProcesado {

    //si el envio no tiene usuario se pone este por defecto
    if (!envio.user)
        envio.user = {id: 0, name: "N0USER173", nick: "N0USER173", avatar: "https://aceptaelreto.com/pub/user/noavatar.jpg"};

    if (!envio.submissionDate)
        console.log("aaa");

    const fecha = new Date(envio.submissionDate);

    let envioProcesado: EnvioProcesado = {
        envioId: envio.num,
        usuario: envio.user.nick,
        problema: envio.problem.title,
        //categoria: envio.categoria, //TODO categorias problemas
        resultado: envio.result,
        lenguaje: envio.language,
        tiempo: envio.executionTime,
        memoria: envio.memoryUser, //TODO diria que esto no lo usamos en ningun momento
        pos: envio.ranking, //TODO diria que esto tampoco
        fecha: envio.submissionDate / 1000,
        hora: fecha.getHours()
    };

    return envioProcesado;
}

async function procesarEnvio(envio: EnvioProcesado, pipeline?: any, modo: "cargaInicial" | "envioIndividual" = "envioIndividual") {

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
            //categoria: envio.categoria, //TODO categorias problemas
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            fecha: envio.fecha
        },
        pipeline
    );

    if (modo === "envioIndividual") {
        const logrosNuevos = await ServicioLogro.procesarLogrosTiempoReal(envio);
        usuarioDAO.guardarLogros(envio.usuario, logrosNuevos, pipeline);
    }
}

// Para la parte de actualizacion de los logros en la carga inicial, primero se guardara la informacion necesaria
// en memoria para poder acceder a ella mas rapidamente. Esta funcion actualiza los datos en memoria tras un envio
async function actualizarEstado(estadoUsuario: EstadoUsuario, estadoProblema: EstadoProblema, envio: EnvioProcesado) {
    estadoUsuario.numEnvios++;
    estadoUsuario.franjasHorarias.add(envio.hora);
    estadoUsuario.lenguajes.add(envio.lenguaje);

    const ultimoDiaEnvio: string = estadoUsuario.ultimoDiaEnvio || "";
    const fecha = new Date(envio.fecha * 1000);
    //TODO aqui ahora se va a mostrar la fecha desde el comienzo del dia
    const strFecha: string = `${fecha.getDate().toString().padStart(2, '0')}-${(fecha.getMonth() + 1).toString().padStart(2, '0')}-${fecha.getFullYear()}`;
    if (ultimoDiaEnvio !== strFecha) {
        const [dia, mes, anio] = estadoUsuario.ultimoDiaEnvio?.split('-').map(Number) || [1, 1, 1]; //TODO mirar esto mejor
        const fechaAnterior = new Date(anio, mes - 1, dia);
        const timepoEntreFechas = (envio.fecha - fechaAnterior.valueOf()) / 1000;

        if (timepoEntreFechas === 86400) { // si las fechas son de dias consecutivos aumentamos la racha
            estadoUsuario.rachaDiasEnvio++;
            const rachaMax = estadoUsuario.rachaDiasEnvioMax || 0;
            if (estadoUsuario.rachaDiasEnvio > rachaMax) {
                estadoUsuario.rachaDiasEnvioMax = estadoUsuario.rachaDiasEnvio;
            }
        } else if (timepoEntreFechas > 86400) { //si la diferencia es mayor significa que se ha perdido la racha de dias
            estadoUsuario.rachaDiasEnvio = 1;
        }
        estadoUsuario.ultimoDiaEnvio = strFecha;
    }
    if (envio.resultado === "AC") {
        //estadoUsuario.categoriaProblemasResueltos.add(envio.categoria) //TODO categorias problemas
        const numProblemasLeng: number = (estadoUsuario.lenguajesProblemasResueltos.get(envio.lenguaje) || 0) + 1;
        estadoUsuario.lenguajesProblemasResueltos.set(envio.lenguaje, numProblemasLeng);

        const mejorTiempoProblema = estadoProblema.mejorTiempo || 987654;
        if (envio.tiempo <= mejorTiempoProblema) {
            estadoUsuario.logros.add("logro17"); //TODO cambiar el nombre cuando este el final
            estadoProblema.mejorTiempo = envio.tiempo;
        }
    } else {
        estadoUsuario.rachaEnviosAC = 0;
    }
}