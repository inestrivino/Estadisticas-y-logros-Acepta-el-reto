//libreria necesaria para que el servidor pueda enviar mensajes a RabbitMQ por el protocolo AMQP
import amqp from "amqplib";
import { setTimeout } from "timers/promises";

//Canal que se necesita para enviar mensajes a RabbitMQ.
//Se mantiene en memoria para evitar reconexiones innecesarias.
//Si la conexion se pierde el siguiente intento de notificación intentara reconectar
let canal: any = null;

const RETRY_DELAY_MS = 5000;

/**
 * Publica un bloque de envios como un unico mensaje en la cola de RabbitMQ.
 * @param bloque - Array de envios con su informacion de problema asociada.
 */
export async function notificarBloqueEnvios(bloque: any[]) {
    const conexion = await conectar();
    await conexion.sendToQueue(
        process.env.QUEUE_NAME,
        Buffer.from(JSON.stringify(bloque)),
        { persistent: true }
    );
}

/**
 * Devuelve el canal de RabbitMQ activo, creandolo si aun no existe.
 * @returns Canal listo para publicar mensajes.
 */
export async function conectar() {
    //Si ya se tiene el canal creado se devuelve directamente
    if (canal !== null)
        return canal;

    //Variables de entorno
    const url = process.env.RABBITMQ_URL!;
    const cola = process.env.QUEUE_NAME!;

    canal = await intento(url, cola);
}

/**
 * Intenta conectarse a RabbitMQ y crear el canal. Si falla, reintenta tras un delay.
 * @param url - URL de conexion a RabbitMQ.
 * @param cola - Nombre de la cola a declarar.
 * @returns Canal listo para publicar mensajes.
 */
async function intento(url: string, cola: string) {
    try {
        const conexion = await amqp.connect(url);
        const intento = await conexion.createChannel();
        await intento.assertQueue(cola, { durable: true });

        console.log("Conectado a RabbitMQ");

        conexion.on("error", () => {
            canal = null;
            console.warn("Conexion a RabbitMQ perdida debido a un error");
        });
        conexion.on("close", () => { canal = null; });

        return intento;
    }
    catch (err) {
        canal = null;
        console.error(`- No se pudo conectar a RabbitMQ: ${err}`);
        await setTimeout(RETRY_DELAY_MS);
        return await intento(url, cola);
    }
}