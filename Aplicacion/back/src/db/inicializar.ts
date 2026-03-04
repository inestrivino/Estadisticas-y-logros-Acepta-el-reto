import fs from 'fs';
import redisClient from '../redis/redisClient.js';

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

type datosProblema = {
    "problema": string,
    "resultado": string,
    "lenguaje": string,
    "tiempo": number,
}

export default async function inicializar() {

    // Hace las peticiones para obtener los envios
    // . . .

    // Simulacion de envios
    let envios: Envio[] = simularEnvios();
    await redisClient.flushAll();

    for (const envio of envios) {
        //informacion de los problemas
        datosProblemas({
            problema: envio.problema,
            resultado: envio.resultado,
            lenguaje: envio.lenguaje,
            tiempo: envio.tiempo
        });

        //informacion de los usuarios
        // . . .
    }
}

async function datosProblemas(dato:datosProblema) {
    //suma uno mas a los envios de ese problema
    await redisClient.incr(`problema:${dato.problema}:envios`);

    //suma el tiempo de este envio
    await redisClient.incrByFloat(`problema:${dato.problema}:totalTiempo`, dato.tiempo);

    //suma uno mas al resultado de este problema
    await redisClient.hIncrBy(`problema:${dato.problema}:resultados`, dato.resultado, 1);

    //suma uno mas al lenguaje de ese problema
    await redisClient.hIncrBy(`problema:${dato.problema}:lenguajes`, dato.lenguaje, 1);
}

//========================= PRUEBAS =========================

function simularEnvios(): Envio[] {
    return JSON.parse(fs.readFileSync("./data/envios.json", "utf8"));
}