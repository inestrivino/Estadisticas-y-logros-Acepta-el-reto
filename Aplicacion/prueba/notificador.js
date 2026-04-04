require("dotenv").config();

//libreria necesaria para que el servidor pueda enviar mensajes a RabbitMQ por el protocolo AMQP
const amqp = require("amqplib");

//Canal que se necesita para enviar mensajes a RabbitMQ. 
//Se mantiene en memoria para evitar reconexiones innecesarias. 
//Si la conexion se pierde el siguiente intento de notificación intentara reconectar
let canal = null;

async function conectar() {
    //Si ya se tiene el canal creado se devuelve directamente
    if (canal !== null) 
        return canal;

    //Variables de entorno
    const url = process.env.RABBITMQ_URL;
    const cola = process.env.QUEUE_NAME;

    try {
        const conexion = await amqp.connect(url);
        canal = await conexion.createChannel();
        await canal.assertQueue(cola, { durable: true });

        console.log("Conectado a RabbitMQ");

        conexion.on("error", () => {
            canal = null;
            console.warn("Conexion a RabbitMQ perdida debido a un error");
        });
        conexion.on("close", () => { canal = null; });

        return canal;

    } catch (err) {
        canal = null;
        throw new Error(`No se pudo conectar a RabbitMQ:\n${err.message}`);
    }
}

async function notificarEnvio(envio) {
    const conexion = await conectar();
    await conexion.sendToQueue(
        process.env.QUEUE_NAME,
        Buffer.from(JSON.stringify(envio)),
        { persistent: true }
    );
}

module.exports = { notificarEnvio };