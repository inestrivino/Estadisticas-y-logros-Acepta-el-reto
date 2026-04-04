import { cargarEnvio } from "../servicios/procesarEnviosService.js";
import recargarComponentes from "../sockets/socketEmitter.js";

// Librería que implementa el protocolo AMQP para hablar con RabbitMQ
import amqp from "amqplib";

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const QUEUE_NAME = process.env.QUEUE_NAME;
const RETRY_DELAY_MS = 5000;

export default async function iniciarConsumidor(): Promise<void> {

  if (!RABBITMQ_URL || !QUEUE_NAME) {
    console.error("Faltan variables de entorno RABBITMQ_URL o QUEUE_NAME");
    return;
  }

  try {
    //Se abre la conexión TCP con RabbitMQ
    const conexion = await amqp.connect(RABBITMQ_URL);

    //Se crea un canal virutal dentro de la conexion
    const canal = await conexion.createChannel();

    //Se declara la cola, durable true hace que la cola sobreviva a reinicios de RabbitMQ
    await canal.assertQueue(QUEUE_NAME, { durable: true });

    //Limita a procesar 1 mensaje a la vez
    canal.prefetch(1);

    console.log(` * Escuchando cola "${QUEUE_NAME} de RabbitMQ`);

    // Se suscribe a la cola. El callback se ejecuta cada vez que llega un mensaje.
    canal.consume(QUEUE_NAME, async (msg) => {

      if (!msg) 
        return;

      try {
        // msg.content es un Buffer (bytes crudos), lo convertimos a string y parseamos el JSON
        const envio = JSON.parse(msg.content.toString());

        await cargarEnvio(envio);
        await recargarComponentes(envio);

        //Se le dice a RabbitMQ que el mensaje se ha procesado correctamente y puede ser eliminado de la cola
        canal.ack(msg);
      } 
      catch (err) {
        console.error(" - Error procesando mensaje:", (err as Error).message);
        canal.nack(msg, false, false);
      }
    });

    //Si la conexion falla por un error intenta volver a conectarse
    conexion.on("error", (err) => {
      console.error(" - Error de conexion con RabbitMQ:", err.message);
      setTimeout(iniciarConsumidor, RETRY_DELAY_MS);
    });

    //Lo mismo pero si se reinicia el servidor RabbitMQ
    conexion.on("close", () => {
      console.warn(" - Reiniciando consumidor:");
      setTimeout(iniciarConsumidor, RETRY_DELAY_MS);
    });

  } 
  catch (err) {
    console.error(" - No se pudo conectar a RabbitMQ:", (err as Error).message);
    setTimeout(iniciarConsumidor, RETRY_DELAY_MS);
  }
}