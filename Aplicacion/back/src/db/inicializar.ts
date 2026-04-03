import fs from 'fs';
import redisClient from '../redis/redisClient.js';
import { cargarEnvio, cargarBloqueEnvios } from './cargarDatos.js';
import ServicioLogro from "src/servicios/logros/ServicioLogro.js";
import EstadoServicio from 'src/servicios/estado/EstadoServicio.js';

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

export default async function inicializar() {

    //Hace las peticiones para obtener los envios
    //TODO . . . 
    //Ahora mismo se simula la obtencion de envios

    //si ya tiene datos la base de datos
    //TODO aqui habria que poner que mire el ultimo envio que hay y hasta cual tiene
    const keys = await redisClient.keys('*');
    if (keys.length > 0/* && false*/) {
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
    EstadoServicio.clear();
}


//========================= PRUEBAS =========================
//TODO quitarlo al final

function* simularEnvios(): Generator<Envio> {
    const resultados = ["AC","PE","WA","CE","RTE","TLE","MLE","OLE","RF","IQ","IE"];
    const lenguajes = ["c", "cpp", "java"];
    const categorias = ["construccion de programacion", "estructuras de datos", "algoritmia", "matematicas", "grafos", "geometria"];
    const usuarios = Array.from({length: 1}, (_, i) => `user${i + 1}`);
    const problemas = Array.from({length: 3}, (_, i) => `problema${i + 1}`);

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
| Usuario           | Objetivo                                   |
| ----------------- | ------------------------------------------ |
| `user_basico`     | onboarding básico (logro1, logro2)         |
| `user_10`         | 10 problemas                               |
| `user_50`         | 50 problemas                               |
| `user_100`        | 100 problemas                              |
| `user_500`        | 500 problemas                              |
| `user_lenguajes`  | 25 problemas en C, C++, Java + 3 lenguajes |
| `user_racha_ac`   | racha de 5 AC seguidos                     |
| `user_racha_dias` | 7 días consecutivos                        |
| `user_categorias` | todas las categorías                       |
| `user_franjas`    | 24 horas                                   |
| `user_top_tiempo` | mejor tiempo                               |
| `user_5_logros`   | al menos 5 logros                          |

*/

/*
function* simularEnvios(): Generator<Envio> {

    const categorias = [
        "construccion de programacion",
        "estructuras de datos",
        "algoritmia",
        "matematicas",
        "grafos",
        "geometria"
    ];

    let envioId = 1;

    function crearEnvio(
        usuario: string,
        problema: string,
        resultado: string,
        lenguaje: string,
        categoria: string,
        fecha: Date,
        tiempo = 1
    ): Envio {
        return {
            envioId: envioId++,
            usuario,
            problema,
            categoria,
            resultado,
            lenguaje,
            tiempo,
            memoria: 1000,
            pos: 1,
            fecha: fecha.toISOString()
        };
    }

    const baseDate = new Date(2024, 0, 1);

    // =========================
    // 1. USER BASICO
    // logro1, logro2
    yield crearEnvio("user_basico", "p1", "WA", "c", categorias[0], baseDate);

    // =========================
    // 2. USER 10 PROBLEMAS
    // logro4
    for (let i = 0; i < 10; i++) {
        yield crearEnvio("user_10", `p${i}`, "AC", "c", categorias[0], baseDate);
    }

    // =========================
    // 3. USER 50 PROBLEMAS
    // logro5
    for (let i = 0; i < 50; i++) {
        yield crearEnvio("user_50", `p${i}`, "AC", "cpp", categorias[1], baseDate);
    }

    // =========================
    // 4. USER 100 PROBLEMAS
    // logro6
    for (let i = 0; i < 100; i++) {
        yield crearEnvio("user_100", `p${i}`, "AC", "java", categorias[2], baseDate);
    }

    // =========================
    // 5. USER 500 PROBLEMAS
    // logro7
    for (let i = 0; i < 500; i++) {
        yield crearEnvio("user_500", `p${i}`, "AC", "c", categorias[3], baseDate);
    }

    // =========================
    // 6. USER LENGUAJES
    // logros 8,9,10,11
    for (let i = 0; i < 24; i++) {
        yield crearEnvio("user_lenguajes", `pc${i}`, "AC", "c", categorias[0], baseDate);
        yield crearEnvio("user_lenguajes", `pcpp${i}`, "AC", "cpp", categorias[1], baseDate);
        yield crearEnvio("user_lenguajes", `pjava${i}`, "AC", "java", categorias[2], baseDate);
    }

    // =========================
    // 7. RACHA AC (5 seguidos)
    // logro12
    for (let i = 0; i < 5; i++) {
        yield crearEnvio("user_racha_ac", `p${i}`, "AC", "c", categorias[0], baseDate);
    }

    // =========================
    // 8. RACHA DIAS (7 días)
    // logro13
    for (let i = 0; i < 7; i++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + i);
        yield crearEnvio("user_racha_dias", `p${i}`, "WA", "c", categorias[0], d);
    }

    // =========================
    // 9. CATEGORIAS
    // logro16
    for (let i = 0; i < categorias.length; i++) {
        const cat = categorias[i];
        yield crearEnvio("user_categorias", `p${i}`, "AC", "c", cat, baseDate);
    }

    // =========================
    // 10. FRANJAS HORARIAS
    // logro18
    for (let h = 0; h < 24; h++) {
        const d = new Date(baseDate);
        d.setHours(h);
        yield crearEnvio("user_franjas", `p${h}`, "WA", "c", categorias[0], d);
    }

    // =========================
    // 11. MEJOR TIEMPO
    // logro17
    yield crearEnvio("user_top_tiempo", "p1", "AC", "c", categorias[0], baseDate, 0.001);

    // =========================
    // 12. USER 5 LOGROS
    // logro3
    for (let i = 0; i < 10; i++) {
        yield crearEnvio("user_5_logros", `p${i}`, "AC", "c", categorias[i % categorias.length], baseDate);
    }
    for (let i = 0; i < 5; i++) {
        yield crearEnvio("user_5_logros", `extra${i}`, "AC", "cpp", categorias[0], baseDate);
    }
}
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