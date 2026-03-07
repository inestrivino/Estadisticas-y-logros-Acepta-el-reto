//librerias
import express, { Request, Response, Application } from 'express';
import 'dotenv/config'
//archivos
import redisClient from './redis/redisClient.js';
import { initSocket } from './sockets/socketInit.js';
import inicializar from './db/inicializar.js';
//routers
import rutasProblemas from "./api/problemas.js";

//============== INICIAR EL SERVIDOR ==============
const app = express();
app.use(express.json());

await redisClient.connect();

//inicializo la base de datos de redis con los datos historicos
await inicializar();

//incializo el socket
initSocket(app);

//====================== RUTAS ======================
app.use("/api/problemas", rutasProblemas);

//ruta solo para simular nuevas entradas a la base de datos
import routerSocket from "./sockets/socketEmitter.js";
app.post("/api/nuevo", (request, response) => {
    const body = request.body
    routerSocket(body);
    response.sendStatus(200);
});

app.listen(3000, (error) => {
    if (error)
        console.log(" * Error:\n" + error);
    else
        console.log(" * Corriendo en puerto 3000");
});