import { notificarBloqueEnvios } from "./notificador.js"

type EventType = {
    id: number;
    type: string;
    msg: {
        nick: string;
        uid: number;
        ver: string;
        mem: number;
        sbt: number;
        lan: string;
        name: string;
        rank: number;
        pid: number;
        run: number;
        sid: number;
    }
}

const firstUrl = process.env.firstUrl!;
const secondUrl = process.env.secondUrl!;

/**
 * Bucle principal que detecta y notifica continuamente los envios nuevos.
 * Consulta la API periodicamente, agrupa los envios del ciclo en un bloque
 * y los publica en RabbitMQ de una sola vez.
 */
export default async function detectarNuevos() {
    let lastKnownId = 0;
    let json: EventType[] = [];
    while (true) {
        try {

            json = await getEvents(lastKnownId);

            if (json.length > 0) {

                lastKnownId = json[json.length - 1].id;

                if (json.length !== 1 || json[0].msg.ver !== "IQ")
                    console.log(" * Respuesta del servidor");

                const bloque = [];
                for (const event of json) {

                    if (event.msg.ver === "IQ")
                        continue;

                    const problem = await getInfoProblem(event.msg.pid);
                    console.log(` - Llega envio con Id: ${event.id}`);
                    bloque.push({ envio: event.msg, problema: problem });
                }

                if (bloque.length > 0)
                    await notificarBloqueEnvios(bloque);
            }
            else
                console.log("No hay eventos nuevos");

        } catch (err) {

            console.error(`Algo fallo: ${err}`);
            await new Promise(res => setTimeout(res, 1000));

        }
    }

}

/**
 * Obtiene los eventos nuevos desde la API a partir del ultimo id conocido.
 * @param lastKnownId - Id del ultimo evento recibido.
 * @returns Array de eventos nuevos, o array vacio si no hay ninguno.
 */
async function getEvents(lastKnownId: number): Promise<EventType[]> {
    const response = await fetch(`${firstUrl}${lastKnownId}`);

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    const text = await response.text();

    if (!text)
        return [];

    const json = await JSON.parse(text);

    return json as EventType[];
};

/**
 * Obtiene la informacion de un problema a partir de su id.
 * @param pid - Id del problema.
 * @returns Objeto con los datos del problema.
 */
async function getInfoProblem(pid: number): Promise<any> {
    const response = await fetch(`${secondUrl}${pid}`);

    if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
    }

    const text = await response.text();

    if (!text)
        return {};

    const json = await JSON.parse(text);

    return json as EventType[];
}