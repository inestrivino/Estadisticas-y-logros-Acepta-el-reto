import procesarEnviosService from "../servicios/procesarEnviosService.js";
import { EnvioSinProcesarEvent } from "../types/envios/envioSinProcesarEvent.js";
import { setTimeout } from "timers/promises";
import amqp from "amqplib"; //Libreria que implementa el protocolo AMQP para hablar con RabbitMQ

const RETRY_DELAY_MS = 5000;

/**
 * Inicia el consumidor de RabbitMQ y comienza a escuchar la cola de envios.
 * @param ultimoEnvio - Id del ultimo envio ya procesado, para ignorar duplicados.
 */
export default function iniciarConsumidor(ultimoEnvio: number): Promise<void> {

  const RABBITMQ_URL = process.env.RABBITMQ_URL!;
  const QUEUE_NAME = process.env.QUEUE_NAME!;

  if (!RABBITMQ_URL || !QUEUE_NAME) {
    console.error("Faltan variables de entorno RABBITMQ_URL o QUEUE_NAME");
    return Promise.resolve();
  }

  //primer intento de conexion
  return intento(ultimoEnvio, RABBITMQ_URL, QUEUE_NAME);
}

/**
 * Intenta conectarse a RabbitMQ y suscribirse a la cola. Si falla, reintenta tras un delay.
 * @param ultimoEnvio - Id del ultimo envio procesado.
 * @param rabbitMqUrl - URL de conexion a RabbitMQ.
 * @param cola - Nombre de la cola a consumir.
 */
async function intento(ultimoEnvio: number, rabbitMqUrl: string, cola: string) {
  try {
    const conexion = await amqp.connect(rabbitMqUrl);
    const canal = await configurarCanal(conexion, cola);

    console.log(` * Escuchando cola "${cola}" de RabbitMQ`);

    canal.consume(cola, async (msg: string) => {
      if (msg === undefined || msg === null)
        return;

      try {
        ultimoEnvio = await procesarMensaje(msg, ultimoEnvio);
        canal.ack(msg);
      }
      catch (err) {
        console.error(" - Error procesando mensaje:", (err as Error).message);
        canal.nack(msg, false, false);
      }
    });

    conexion.on("error", async (err) => {
      console.error(" - Error de conexion con RabbitMQ:", err.message);
      await setTimeout(RETRY_DELAY_MS);
      return await intento(ultimoEnvio, rabbitMqUrl, cola);
    });

    conexion.on("close", async () => {
      console.warn(" - Reiniciando consumidor:");
      await setTimeout(RETRY_DELAY_MS);
      return await intento(ultimoEnvio, rabbitMqUrl, cola);
    });

  }
  catch (err) {
    console.error(" - No se pudo conectar a RabbitMQ:", (err as Error).message);
    await setTimeout(RETRY_DELAY_MS);
    return await intento(ultimoEnvio, rabbitMqUrl, cola);
  }
}

/**
 * Crea y configura el canal virtual de RabbitMQ.
 * @param conexion - Conexion TCP activa con RabbitMQ.
 * @param cola - Nombre de la cola a declarar.
 * @returns Canal listo para consumir mensajes.
 */
async function configurarCanal(conexion: any, cola: string) {
  const canal = await conexion.createChannel();
  await canal.assertQueue(cola, { durable: true });
  canal.prefetch(1);
  return canal;
}

/**
 * Parsea y procesa un mensaje de RabbitMQ, ignorando envios ya procesados.
 * @param msg - Mensaje recibido de RabbitMQ.
 * @param ultimoEnvio - Id del ultimo envio procesado.
 * @returns Id del ultimo envio procesado tras manejar el mensaje.
 */
async function procesarMensaje(msg: any, ultimoEnvio: number): Promise<number> {
  const bloque: EnvioSinProcesarEvent[] = JSON.parse(msg.content.toString());
  const bloqueNuevo = bloque.filter(e => e.envio.sid > ultimoEnvio);

  if (bloqueNuevo.length > 0) {
    await procesarEnviosService.procesarBloqueEnviosEvent(bloqueNuevo);
    return bloqueNuevo[bloqueNuevo.length - 1].envio.sid;
  }

  return ultimoEnvio;
}