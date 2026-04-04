import redisClient from '../redis/redisClient.js';
import { cargarBloqueEnvios } from './procesarEnviosService.js';

type Envio = {
    envioId: number
    usuario: string,
    problema: string,
    resultado: string,
    lenguaje: string,
    tiempo: number,
    memoria: number,
    pos: number,
    fecha: string
};

export default async function inicializar() {

    //Hace las peticiones para obtener los envios
    //TODO . . . 
    //Ahora mismo se simula la obtencion de envios
    
    //si ya tiene datos la base de datos
    //TODO aqui habria que poner que mire el ultimo envio que hay y hasta cual tiene
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
        console.log(" * Envios ya cargados");
        return;
    }
    else
        await redisClient.flushAll();

    //se meten los datos en la base de datos en bloques de 1000 en 1000
    const BLOQUE = 1000;
    let numBloque = 1;
    let idxBloque = 0;
    let bloque:Envio[] = [];

    //TODO quitar esto al final
    let i = 0;
    const LIMITE = 1000000; 
    for (const envio of simularEnvios()) {
        
        //TODO quitar esto
        if (i >= LIMITE)
            break;

        if (idxBloque < BLOQUE) {
            bloque.push(envio);
            idxBloque++;
        }
        else {
            await cargarBloqueEnvios(bloque);
            bloque = [];
            idxBloque = 0;
            console.log(" - Bloque " + numBloque + " cargado");
            numBloque++;
        }       
        
        i++;
    }
    if (bloque.length !== 0) {
        await cargarBloqueEnvios(bloque);
        console.log(" - Bloque " + numBloque + " cargado");
    }
}


//========================= PRUEBAS =========================
//TODO quitarlo al final
function* simularEnvios(): Generator<Envio> {
    const resultados = ["AC","PE","WA","CE","RTE","TLE","MLE","OLE","RF","IQ","IE"];
    const lenguajes = ["c", "cpp", "java"];
    const usuarios = Array.from({length: 1}, (_, i) => `user${i + 1}`);
    const problemas = Array.from({length: 3}, (_, i) => `problema${i + 1}`);

    for (let i = 1; i <= 1000000; i++) {
        yield {
            envioId: i,
            usuario: usuarios[Math.floor(Math.random() * usuarios.length)],
            problema: problemas[Math.floor(Math.random() * problemas.length)],
            resultado: resultados[Math.floor(Math.random() * resultados.length)],
            lenguaje: lenguajes[Math.floor(Math.random() * lenguajes.length)],
            tiempo: +(Math.random() * 2 + 0.001).toFixed(3),
            memoria: Math.floor(500 + Math.random() * 4000),
            pos: Math.floor(1 + Math.random() * 100),
            fecha: new Date(2025, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28))
                .toISOString().split("T")[0]
        };
    }
}