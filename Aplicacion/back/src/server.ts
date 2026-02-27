//librerias
import express, { Request, Response, Application } from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import 'dotenv/config'
//archivos
import { initSocket } from './sockets/socketInit.ts';
import { initRedis } from './redis/redisInit.ts';
//routers
import rutasProblemas from "./api/problemas.ts";

//============== INICIAR EL SERVIDOR ==============
const app = express();
app.use(express.json());

//incializo el socket
initSocket(app);

//DEBUG - inicializo redis con los envios de prueba
initRedis();

//====================== RUTAS ======================
app.use("/api/problemas", rutasProblemas);

//ruta solo para simular nuevas entradas a la base de datos
import routerSocket from "./sockets/socketRouter.ts";
app.post("/api/nuevo", (request, response) => {
    const body = request.body
    routerSocket(body);
    response.sendStatus(200);
})

//RUTAS DE VISTAS EN PRODUCCION
if (process.env.NODE_ENV === 'production') {
    //debug
    console.log(" * Iniciando en modo PRODUCCION");

    app.use(express.static(path.join(process.cwd(), 'dist-front')));

    app.get('/', (req, res) => {
        console.log("LLego a /");
        res.sendFile(path.join(process.cwd(), 'dist-front', 'index.html'));
    });

    app.get('/home', (req, res) => {
        console.log("LLego a /home");
        res.sendFile(path.join(process.cwd(), 'dist-front', 'index.html'));
    });

    app.get('/pruebaSocket', (req, res) => {
        console.log("LLego a /diagramas");
        res.sendFile(path.join(process.cwd(), 'dist-front', 'public', 'pruebaSocket.html'));
    });
}

//RUTAS DE VISTAS EN DESARROLLO
else if (process.env.NODE_ENV === 'development') {
    //debug
    console.log(" * Iniciando en modo DESARROLLO");

    const proxy = createProxyMiddleware({
        target: 'http://localhost:5173',
        changeOrigin: true,
        /*pathRewrite: {
            '^/pruebaSocket$': '/public/pruebaSocket.html',
            '^/$': '/index.html',
        }*/
    });

    app.use('/', proxy);
};

app.listen(3000, (error) => {
    if (error)
        console.log(" * Error:\n" + error);
    else
        console.log(" * Corriendo en puerto 3000");
});