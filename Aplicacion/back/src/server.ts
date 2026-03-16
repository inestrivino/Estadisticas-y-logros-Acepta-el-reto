//librerias
import express from 'express';
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

//TODO quitar esto
//import activarCron from "./db/limpiarDatosAntiguos.js";
//activarCron();

await redisClient.connect();

//inicializo la base de datos de redis con los datos historicos
await inicializar();

//TODO quitar esto
//import UsuarioDAO from 'src/dao/usuarioDAO.js';
//const usuarioDAO = new UsuarioDAO();
//const hoy = new Date;
//hoy.setHours(0, 0, 0, 0);
//const timeFin = hoy.valueOf() / 1000; // timeStamp en segundos
//let timeIni = timeFin - 31536000 // 365 * 24 * 60 * 60;
//timeIni += 86400; // 86400 = 24 * 60 * 60
//usuarioDAO.getEnviosUsuario('user1', timeIni, timeFin);

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