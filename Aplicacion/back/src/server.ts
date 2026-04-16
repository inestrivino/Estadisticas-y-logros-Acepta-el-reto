//librerias
import express from 'express';
import 'dotenv/config'
//archivos
import redisClient from './redis/redisClient.js';
import { initSocket } from './sockets/socketInit.js';
import InicializarService from './servicios/inicializarService.js';
import initConsumer from "./consumer/cosumer.js";
//routers
import rutasProblemas from "./api/problemas.js";
import rutasUsuarios from "./api/usuarios.js";

//============== CONFIGURACION ==============
const app = express();
app.use(express.json());

//====================== RUTAS ======================
app.use("/api/problemas", rutasProblemas);
app.use("/api/usuarios", rutasUsuarios);

app.listen(3000, (error) => {
    if (error)
        console.log(" * Error:\n" + error);
    else
        console.log(" * Corriendo en puerto 3000");
});

//============== INICIAR EL SERVIDOR ==============
//se conecta a la base de datos
await redisClient.connect();

//incializo el socket
initSocket(app);

//inicializo la base de datos de redis con los datos historicos
const inicializarService = new InicializarService();
await inicializarService.inicializar();

//una vez estan cargados los datos historicos se empiezan a escuchar los nuevos
await initConsumer();