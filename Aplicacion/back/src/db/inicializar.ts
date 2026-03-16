import fs from 'fs';
import redisClient from '../redis/redisClient.js';
import { cargarDatos } from './cargarDatos.js';

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

export default async function inicializar() {

    //Hace las peticiones para obtener los envios
    // . . .
    //Ahora mismo se simula la obtencion de envios
    let envios: Envio[] = simularEnvios();
    await redisClient.flushAll();

    let promesas = [];
    for (const envio of envios) {
        promesas.push(cargarDatos(envio));
    }
    
    await Promise.all(promesas);
}


//========================= PRUEBAS =========================

function simularEnvios(): Envio[] {
    return JSON.parse(fs.readFileSync("./data/envios.json", "utf8"));
}