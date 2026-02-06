import express, { Request, Response, Application } from 'express';
import path from 'path';
import { createProxyMiddleware } from 'http-proxy-middleware';
import 'dotenv/config'

import redisClient from './redisClient.ts';
import { initSocket, sendDatos } from './socket.ts';
import { initRedis } from './redisInit.ts';

//============== INICIAR EL SERVIDOR ==============
const app = express();
app.use(express.json());

//incializo el socket
initSocket(app);

//DEBUG - inicializo redis con los envios de prueba
initRedis();

//====================== RUTAS ======================
//simulo una ruta de api
app.get('/api/problemas', async (req: Request, res: Response) => {
  const envioIds = await redisClient.sMembers('problema:problema1:envios');
  const pipeline = redisClient.multi();

  for (const id of envioIds) {
    pipeline.hGet(`${id}`, 'resultado');
  }

  const resultados = await pipeline.exec();

  sendDatos(resultados);
});

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
    pathRewrite: {
      '^/pruebaSocket$': '/public/pruebaSocket.html',
      '^/$': '/index.html',
    }/*,
    on: {
      proxyReq: (proxyReq, req, res) => {
        console.log(proxyReq.path);
        console.log(req.url)
      },
      error: (err, req, res) => {
        console.error('Proxy error:', err);
      },
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