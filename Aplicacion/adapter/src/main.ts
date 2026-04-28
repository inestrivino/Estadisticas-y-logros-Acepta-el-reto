import detectarNuevos from "./detectarNuevos.js"
import { conectar } from "./notificador.js"

async function main () {
    await conectar();
    console.log(" * Adaptador conectado a rabbitMQ")
    detectarNuevos();
}

main();