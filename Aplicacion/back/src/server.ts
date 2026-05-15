//librerias
import express from 'express';
import 'dotenv/config'
//archivos
import redisClient from './redis/redisClient.js';
import redisLoading from './redis/redisLoading.js';
import { initSocket } from './sockets/socketInit.js';
import inicializarService from './servicios/inicializarService.js';
import gestionService from './servicios/gestionService.js';
import initConsumer from "./consumer/cosumer.js";
//routers
import rutasProblemas from "./api/problemas.js";
import rutasUsuarios from "./api/usuarios.js";
import rutasGestion from "./api/gestion.js";
import usuarioService from './servicios/usuarioService.js';
import checkpointsService from './servicios/checkpointsService.js';

//============== CONFIGURACION ==============
const app = express();
app.use(express.json());

//====================== RUTAS ======================
app.use("/api/problemas", rutasProblemas);
app.use("/api/usuarios", rutasUsuarios);
app.use("/api/gestion", rutasGestion);

app.listen(3000, (error) => {
    if (error)
        console.log(" * Error:\n" + error);
    else
        console.log(" * Corriendo en puerto 3000");
});

//============== INICIAR EL SERVIDOR ==============
//se conecta a la base de datos
await redisClient.connect();
await redisLoading();

//incializo el socket
initSocket(app);

//comprueba si hay que volver a lanzar la aplicacion de 0
await gestionService.checkVersion();

//se mira si algun actualizador ha cambiado de version o si hay alguno nuevo
await checkpointsService.comprobarVersiones();

//se eliminan los envios anteriores a un año
await usuarioService.eliminarEnviosAntiguos(); 

//inicializo la base de datos de redis con los datos historicos
await inicializarService.inicializar();

//se saca el id del ultimo envio procesado
const ultimoEnvio = await gestionService.getUltimoEnvio();

//una vez estan cargados los datos historicos se empiezan a escuchar los nuevos
await initConsumer(ultimoEnvio);