import express, { Request, Response } from 'express';
import redisClient from './redisClient.js';
import { WebSocketServer  } from 'ws';
import http from "http";
import { Server } from 'socket.io';

import path from 'path';
import { fileURLToPath } from 'url';
import {createProxyMiddleware} from 'http-proxy-middleware';
import 'dotenv/config'

/*
docker run -d --name redis-server -p 6379:6379 redis
*/

const app = express();
const server = http.createServer(app);

//prueba de websocket
const io = new Server(server, {
  cors: { origin: "*" }
});
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');
  socket.on('message', (message) => {
    console.log(message);
    io.emit('message', `${socket.id.substring(0,2)} said ${message}`);
  });
});
server.listen(8080, () => console.log(' * Servidor WebSocket escuchando en el puerto 8080'));

app.use(express.json());

//simulo una ruta de api
app.get('/api/diagrama2', (req: Request, res: Response) => {
  console.log("Redirigiendo a diagramaDinamico.html");
  //res.redirect('/public/diagramaDinamico.html');
});
 
if (process.env.NODE_ENV === 'production') {
  //debug
  console.log(" * Iniciando en modo PRODUCCION");

  app.use(express.static(path.join(process.cwd(), 'dist')));

  app.get('/', (req, res) => {
    console.log("LLego a /");
    res.sendFile(path.join(process.cwd(), 'dist', 'home.html'));
  });

  app.get('/home', (req, res) => {
    console.log("LLego a /home");
    res.sendFile(path.join(process.cwd(), 'dist', 'home.html'));
  });
  
  app.get('/diagramas', (req, res) => {
    console.log("LLego a /diagramas");
    res.sendFile(path.join(process.cwd(), 'dist', 'public', 'diagramas.html'));
  });
}
else if (process.env.NODE_ENV === 'development') {
  //debug
  console.log(" * Iniciando en modo DESARROLLO");

  const proxy = createProxyMiddleware({
    target: 'http://localhost:5173', 
    changeOrigin: true,
    pathRewrite: {
      '^/diagramas$': '/public/diagramas.html',
      '^/$': '/home.html',
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

interface Usuario {
  email: string;
  password: string;
}
const usuarioFalso: Usuario = {
  email: 'usuario@ejemplo.com',
  password: '1234'
};

/*app.post('/login', async (req: Request, res: Response) => {
  const { email, password }: Usuario = req.body;

  if (email !== usuarioFalso.email) {
    return res.status(401).json({ error: 'Usuario no encontrado' });
  }

  if (password !== usuarioFalso.password) {
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }

  return res.json({ mensaje: 'Login exitoso', usuario: email });
});

app.post("/user", async (req: Request, res: Response) => {
  const { nombre, email } = req.body;
  //TODO aqui habria que validar los datos
  await redisClient.set("user", JSON.stringify({ nombre, email }))
  .then(() => {
    res.json({ mensaje: "Usuario guardado en Redis" });
    res.status(200);
  })
  .catch((err) => {
    res.status(500).json({ error: "Error al guardar el usuario en Redis", detalles: err });
  });
  return res;
});

app.get("/user", async (req: Request, res: Response) => {
  const data = await redisClient.get("user")
  .then((data) => {
    const info = JSON.parse(data as string);
    if (info) {
      res.json(info);
      res.status(200);
      return data;
    }
  })
  .catch((err) => {
    res.status(500).json({ error: "Error al obtener el usuario de Redis", detalles: err });
  });
  return res;
});*/

app.listen(3000, (error) => {
  if(error)
    console.log(" * Error:\n" + error);
  else
    console.log(" * Corriendo en puerto 3000");
});