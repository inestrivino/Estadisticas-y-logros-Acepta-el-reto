import UsuarioDAO from "../dao/usuarioDAO.js";
import ProblemaDAO from "../dao/problemaDAO.js";
import redisClient from '../redis/redisClient.js';
import EstadoServicio from "../servicios/estado/EstadoServicio.js";
import { EstadoUsuario } from "../servicios/estado/EstadoUsuario.js";
import ServicioLogro from "../servicios/logros/ServicioLogro.js";
import { Envio, EnvioProcesado } from "../types/envio.js";
import { EstadoProblema } from "./estado/estadoProblema.js";

export async function cargarBloqueEnvios(envios: Envio[]) {

    //pongo cada envio del bloque con el formato correcto
    const enviosProcesados:EnvioProcesado[] = [];
    for (const envio of envios) {
        enviosProcesados.push(parseEnvio(envio));
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
}

export async function cargarEnvio(envio: Envio) {
    console.log("Carga un envio individual");
    const envioProcesado = parseEnvio(envio);
    await procesarEnvio(envioProcesado, undefined, "envioIndividual");
}

function parseEnvio(envio: Envio):EnvioProcesado {
    const [fecha, horaStr] = envio.fecha.split('T');
    const [anio, mes, dia] = fecha.split('-').map(Number);
    const hora = Number(horaStr.split(':')[0]);

    let envioProcesado:EnvioProcesado = {
        envioId: envio.envioId,
        usuario: envio.usuario,
        problema: envio.problema,
        //categoria: envio.categoria, //TODO categorias problemas
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

async function procesarEnvio(envio: EnvioProcesado, pipeline?: any, modo: "cargaInicial" | "envioIndividual" = "envioIndividual") {
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
            //categoria: envio.categoria, //TODO categorias problemas
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            fecha: envio.fecha
        },
        pipeline
    );

    if(modo === "envioIndividual") {
        const logrosNuevos = await ServicioLogro.procesarLogrosTiempoReal(envio);
        usuarioDAO.guardarLogros(envio.usuario, logrosNuevos, pipeline);
    }
}

// Para la parte de actualizacion de los logros en la carga inicial, primero se guardara la informacion necesaria
//  en memoria para poder acceder a ella mas rapidamente. Esta funcion actualiza los datos en memoria tras un envio
async function actualizarEstado(estadoUsuario: EstadoUsuario, estadoProblema: EstadoProblema, envio: EnvioProcesado) {
    estadoUsuario.numEnvios++;
    estadoUsuario.franjasHorarias.add(envio.fecha.hora);
    estadoUsuario.lenguajes.add(envio.lenguaje);

    const ultimoDiaEnvio: string = estadoUsuario.ultimoDiaEnvio || "";
    const strFecha: string = `${envio.fecha.dia.toString().padStart(2, '0')}-${envio.fecha.mes.toString().padStart(2, '0')}-${envio.fecha.anio}`;
    if (ultimoDiaEnvio !== strFecha) {
        const [dia, mes, anio] = estadoUsuario.ultimoDiaEnvio?.split('-').map(Number) || [1, 1, 1]; //TODO mirar esto mejor
        const fechaAnterior = new Date(anio, mes - 1, dia);
        const fechaEnvio = new Date(envio.fecha.anio, envio.fecha.mes - 1, envio.fecha.dia);
        const timepoEntreFechas = (fechaEnvio.valueOf() - fechaAnterior.valueOf()) / 1000;
        
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
        if(envio.tiempo <= mejorTiempoProblema) {
            estadoUsuario.logros.add("logro17"); //TODO cambiar el nombre cuando este el final
            estadoProblema.mejorTiempo = envio.tiempo;
        }
    } else {
        estadoUsuario.rachaEnviosAC = 0;
    }
}