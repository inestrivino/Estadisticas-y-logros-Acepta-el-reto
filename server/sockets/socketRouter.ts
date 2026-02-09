import {getIO} from "./socketInit.ts"
import {EventType} from "./socketEventTypes.ts"

/*
Recibe el json que llego por rabbitMQ y actualiza los diagramas y logros correspondientes
*/
function routerEvents() {
    const io = getIO();
    console.log(" - Se emite un nuevo envio")
    io.emit(EventType.DIAGRAMA_PROBLEMAS, "Aceptado")
}

export default routerEvents;