import fs from 'fs';
import redisClient from '../redis/redisClient.js';
import { cargarEnvio, cargarBloqueEnvios } from './cargarDatos.js';
import ServicioLogro from "src/servicios/logros/ServicioLogro.js";

type Envio = {
    envioId: number
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

const CATEGORIAS_PROBLEMAS = ["construccion de programacion", "estructuras de datos", "algoritmia", "matematicas", "grafos", "geometria"];

export default async function inicializar() {

    //Hace las peticiones para obtener los envios
    //TODO . . . 
    //Ahora mismo se simula la obtencion de envios
    
    //si ya tiene datos la base de datos
    //TODO aqui habria que poner que mire el ultimo envio que hay y hasta cual tiene
    const keys = await redisClient.keys('*');
    if (keys.length > 0 && false) {
        console.log(" * Envios ya cargados");
        return;
    }
    else
        await redisClient.flushAll();

    //se meten los datos en la base de datos en bloques de 1000 en 1000
    const BLOQUE = 1000;
    let numBloque = 1;
    let idxBloque = 0;
    let bloque: Envio[] = [];

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
    
    await ServicioLogro.calcularYGuardarLogros();
}


//========================= PRUEBAS =========================
//TODO quitarlo al final

function* simularEnvios(): Generator<Envio> {
    const resultados = ["AC","PE","WA","CE","RTE","TLE","MLE","OLE","RF","IQ","IE"];
    const lenguajes = ["c", "cpp", "java"];
    const categorias = ["construccion de programacion", "estructuras de datos", "algoritmia", "matematicas", "grafos", "geometria"];
    const usuarios = Array.from({length: 10000}, (_, i) => `user${i + 1}`);
    const problemas = Array.from({length: 300}, (_, i) => `problema${i + 1}`);

    for (let i = 1; i <= 1000000; i++) {
        yield {
            envioId: i,
            usuario: usuarios[Math.floor(Math.random() * usuarios.length)],
            problema: problemas[Math.floor(Math.random() * problemas.length)],
            categoria: categorias[Math.floor(Math.random() * categorias.length)],
            resultado: resultados[Math.floor(Math.random() * resultados.length)],
            lenguaje: lenguajes[Math.floor(Math.random() * lenguajes.length)],
            tiempo: +(Math.random() * 2 + 0.001).toFixed(3),
            memoria: Math.floor(500 + Math.random() * 4000),
            pos: Math.floor(1 + Math.random() * 100),
            fecha: new Date(2024, Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28), 
                Math.floor(1 + Math.random() * 24)).toISOString()
        };
    }
}
/*
function* simularEnvios(): Generator<Envio> {
    const lenguajes = ["c", "cpp", "java"];
    const problemas = Array.from({ length: 10 }, (_, i) => `problema${i + 1}`);

    let id = 1;

    // Helper
    function crearEnvio(usuario: string, problema: string, categoria: string, resultado: string, lenguaje: string, fecha: Date, tiempo = 1.0): Envio {
        return {
            envioId: id++,
            usuario,
            problema,
            categoria,
            resultado,
            lenguaje,
            tiempo,
            memoria: 1000,
            pos: Math.floor(1 + Math.random() * 100),
            fecha: fecha.toISOString().slice(0, 13)
        };
    }

    // =========================
    // USER 1 → ONBOARDING + CALIDAD BÁSICA
    // =========================
    // Logros:
    // - creación cuenta
    // - primer envío
    // - AC a la primera
    yield crearEnvio("user1", "problema1", "grafos", "AC", "c", new Date(2024, 0, 1));

    // =========================
    // USER 2 → VOLUMEN (10, 50, 100)
    // =========================
    // Logros:
    // - 10, 50, 100 problemas
    for (let i = 0; i < 100; i++) {
        yield crearEnvio("user2", problemas[i % problemas.length], "grafos", "AC", "cpp", new Date(2024, 0, 1));
    }

    // =========================
    // USER 3 → LENGUAJES
    // =========================
    // Logros:
    // - 25 problemas en C, C++, Java
    // - usar 3 lenguajes
    for (const lang of lenguajes) {
        for (let i = 0; i < 25; i++) {
            yield crearEnvio("user3", problemas[i % problemas.length], "grafos", "AC", lang, new Date(2024, 1, 1));
        }
    }

    // =========================
    // USER 4 → RACHAS
    // =========================
    // Logros:
    // - 5 AC seguidos
    // - 7 días consecutivos
    let fechaBase = new Date(2024, 2, 1);

    // 7 días consecutivos
    for (let i = 0; i < 7; i++) {
        yield crearEnvio("user4", "problema1", "grafos", "AC", "c", new Date(fechaBase.getFullYear(), fechaBase.getMonth(), fechaBase.getDate() + i));
    }

    // racha de 5 AC seguidos
    for (let i = 0; i < 5; i++) {
        yield crearEnvio("user4", "problema2", "grafos", "AC", "c", new Date(2024, 3, 1));
    }

    // =========================
    // USER 5 → CALIDAD
    // =========================
    // Logros:
    // - rápido (top 25%)
    // - récord
    // - primer intento
    yield crearEnvio("user5", "problema1", "grafos", "AC", "java", new Date(2024, 4, 1), 0.1); // muy rápido
    yield crearEnvio("user5", "problema2", "grafos", "WA", "java", new Date(2024, 4, 1));
    yield crearEnvio("user5", "problema2", "grafos", "AC", "java", new Date(2024, 4, 1), 0.05); // récord

    // =========================
    // USER 6 → EXTREMOS + CATEGORÍAS
    // =========================
    // Logros:
    // - 500 problemas
    // - una categoría de cada tipo (simulado con problemas distintos)
    // - franjas horarias
    for (let i = 0; i < 500; i++) {
        yield crearEnvio("user6", problemas[i % problemas.length], CATEGORIAS_PROBLEMAS[i % CATEGORIAS_PROBLEMAS.length], "AC", "cpp", new Date(2024, 5, (i % 28) + 1));
    }

    // simular franjas horarias (aunque ahora no tienes hora real)
    for (let i = 0; i < 24; i++) {
        yield crearEnvio("user6", problemas[i], "grafos", "AC", "c", new Date(2024, 6, 1, i));
    }
}
*/
/*
| Usuario | Objetivo principal                                  |
| ------- | --------------------------------------------------- |
| `user1` | Onboarding + primeros logros básicos                |
| `user2` | Volumen (10, 50, 100 problemas)                     |
| `user3` | Lenguajes                                           |
| `user4` | Rachas                                              |
| `user5` | Calidad                                             |
| `user6` | Categorías + extremos (500 problemas, récord, etc.) |

*/

/*
var channel: Channel;

async function createChannel() {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();
}

async function consumeMessage() {
    if(!channel) {
        createChannel();
    }    
    const exchangeName = "nuevoEnvio";

    await channel.assertExchange(exchangeName, "direct");

    const q = await channel.assertQueue("NuevoEnvioQueue");

    //nombre de la queue, nombre del exchange, pattern (en caso de exchange tipo direct es el routing key)
    await channel.bindQueue(q.queue, exchangeName, "envio");

    channel.consume(q.queue, (msg) => {
        if(!msg)
            return;

        const data = JSON.parse(msg.content.toString());
        console.log("Recivido: " + data);
        channel.ack(msg);
    })
}*/