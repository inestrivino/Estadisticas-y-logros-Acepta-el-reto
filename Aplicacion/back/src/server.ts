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

//comprueba versiones y resetea lo necesario
await checkpointsService.comprobarVersiones();

//comprueba si se ha entrado en uno o mas meses naturales nuevos y limpia sus buckets
await checkpointsService.comprobarMesActual();
//y se reprograma cada 24h para detectar el cambio aunque el servidor no se reinicie
setInterval(() => checkpointsService.comprobarMesActual().catch(err => console.error(err)), 24 * 60 * 60 * 1000);

//se eliminan los envios anteriores a un año, y se reprograma cada 24h
await usuarioService.eliminarEnviosAntiguos();
setInterval(() => usuarioService.eliminarEnviosAntiguos().catch(err => console.error(err)), 24 * 60 * 60 * 1000);

//incializo el socket
initSocket(app);

//inicializo la base de datos de redis con los datos historicos
await inicializarService.inicializar();

//se saca el id del ultimo envio procesado
const ultimoEnvio = await gestionService.getUltimoEnvio();

//una vez estan cargados los datos historicos se empiezan a escuchar los nuevos
await initConsumer(ultimoEnvio);